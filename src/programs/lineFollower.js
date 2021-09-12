const robotlib = require('robotlib');
const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const getInitialPosition = require('../utils/motion/getInitialPosition');
const getAngleDistance = require('../utils/sensor/lidar/getAngleDistance');

module.exports = (withObstacle = false) => ({ arena, logger, controllers, sensors }) => {
  const STATE_IDLE = 'idle';
  const STATE_CALIBRATION = 'calibration';
  const STATE_LINE_FOLLOWING = 'lineFollowing';
  const STATE_OBSTACLE_AVOIDANCE = 'obstacleAvoidance';
  const STATE_REDISCOVER_LINE = 'rediscoverLine';
  const STATE_DONE = 'done';

  const { motion } = controllers;
  const { lidar, line: lineSensor } = sensors;
  const calibrationData = [];
  const maxSpeed = 300;
  const speed = maxSpeed - 100;
  const Kp = 40;
  const stopArea = arena.width / 6;

  let lastError = 0;
  let numTimesBelowThreshold = 0;
  let state = STATE_IDLE;
  let obstacleDetected = false;
  let isObstacleAvoiding = false;
  let hasRediscoveredLine = false;
  let passObstancleOnLeftSide;
  let minValue;
  let maxValue;
  let meanValue;

  function constructor() {
    logger.log('constructor', 'lineFollowerObstacle');
  }

  function start() {
    logger.log('start', 'lineFollowerObstacle');

    lidar.on('data', onLidarData);
    lineSensor.on('data', onLineData);

    setTimeout(calibrate, 1000);
  }

  function stop() {
    state = STATE_DONE;

    lidar.off('data', onLidarData);
    lineSensor.off('data', onLineData);

    motion.stop();
  }

  function missionComplete() {
    logger.log('mission complete', 'lineFollowerObstacle');
    stop();
  }

  async function calibrate() {
    const rotationOffset = 20;
    const startPositionMeasurements = await scan(lidar, 1000);
    const startPositionAveragedMeasurements = averageMeasurements(startPositionMeasurements);
    const { x, y } = getInitialPosition(startPositionAveragedMeasurements, arena.height);

    state = STATE_CALIBRATION;

    motion.setTrackPose(true);
    motion.appendPose({ x, y, phi: 0 });

    await motion.rotate(robotlib.utils.math.deg2rad(-rotationOffset));
    await motion.rotate(robotlib.utils.math.deg2rad(rotationOffset * 2));
    await motion.rotate(robotlib.utils.math.deg2rad(-rotationOffset));

    minValue = Math.min(...calibrationData);
    maxValue = Math.max(...calibrationData);
    meanValue = (minValue + maxValue) / 2;

    if (withObstacle) {
      const leftDistance = getAngleDistance(startPositionAveragedMeasurements, 270);
      const rightDistance = getAngleDistance(startPositionAveragedMeasurements, 90);

      passObstancleOnLeftSide = rightDistance > leftDistance;
    }

    state = STATE_LINE_FOLLOWING;
  }

  function lineFollowing(data) {
    const currentPose = motion.getPose();
    const inStopArea = currentPose.x < stopArea;

    if (inStopArea && data.every(value => value < meanValue)) {
      return ++numTimesBelowThreshold <= 20;
    }

    const maxValue = Math.max(...data.filter(value => value > meanValue));
    const index = data.indexOf(maxValue);
    const error = index !== -1 ? index - 3.5 : lastError;
    const leftSpeed = robotlib.utils.constrain(Math.round(speed + (error * Kp)), 0, maxSpeed);
    const rightSpeed = robotlib.utils.constrain(Math.round(speed - (error * Kp)), 0, maxSpeed);

    motion.speedLeftRight(leftSpeed, rightSpeed);
    numTimesBelowThreshold = 0;
    lastError = error;

    return true;
  }

  async function obstacleAvoiding() {
    if (!isObstacleAvoiding) {
      isObstacleAvoiding = true;

      await motion.rotate((Math.PI / 2) * (passObstancleOnLeftSide ? -1 : 1)); // TODO verify angle

      state = STATE_REDISCOVER_LINE;
    }
  }

  async function rediscoverLine(data) {
    if (!hasRediscoveredLine) {
      if (data.every(value => value < meanValue)) {
        const innerWheelSpeed = 120;
        const outerWheelSpeed = 150;
        const leftSpeed = passObstancleOnLeftSide ? outerWheelSpeed : innerWheelSpeed; // TODO verify speed diff
        const rightSpeed = passObstancleOnLeftSide ? innerWheelSpeed : outerWheelSpeed; // TODO verify speed diff

        motion.speedLeftRight(leftSpeed, rightSpeed);

        return;
      }

      hasRediscoveredLine = true;

      await motion.stop();
      await motion.rotate((Math.PI / 2) * (passObstancleOnLeftSide ? -1 : 1));

      state = STATE_LINE_FOLLOWING;
    }
  }

  async function onLidarData({ angle, distance }) {
    if (withObstacle && state === STATE_LINE_FOLLOWING) {
      if (!distance) {
        return;
      }

      const inAngleRange = angle > 300 || angle < 60; // TODO verify if these values are adequate
      const obstancleInSight = distance < 350;

      if (!obstacleDetected && inAngleRange && obstancleInSight) {
        obstacleDetected = true;

        await motion.stop();

        state = STATE_OBSTACLE_AVOIDANCE;
      }
    }
  }

  function onLineData(data) {
    if (state === STATE_CALIBRATION) {
      calibrationData.push(...data);
      return;
    }

    if (state === STATE_LINE_FOLLOWING) {
      if (!lineFollowing(data)) {
        missionComplete();
      }
    }

    if (withObstacle && state === STATE_OBSTACLE_AVOIDANCE) {
      obstacleAvoiding();
    }

    if (withObstacle && state === STATE_REDISCOVER_LINE) {
      rediscoverLine(data);
    }
  }

  constructor();

  return {
    start,
    stop,
  };
};
