const robotlib = require('robotlib');
const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const getInitialPosition = require('../utils/motion/getInitialPosition');
const getAngleDistance = require('../utils/sensor/lidar/getAngleDistance');

module.exports = (withObstacle = false) => ({ config, arena, logger, controllers, sensors }) => {
  const STATE_IDLE = 'idle';
  const STATE_CALIBRATION = 'calibration';
  const STATE_LINE_FOLLOWING = 'lineFollowing';
  const STATE_OBSTACLE_AVOIDANCE = 'obstacleAvoidance';
  const STATE_REDISCOVER_LINE = 'rediscoverLine';
  const STATE_ROTATE_TO_LINE = 'rotateToLine';
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

  async function obstacleAvoiding(data) {
    if (!isObstacleAvoiding) {
      isObstacleAvoiding = true;

      const maxValue = Math.max(...data.filter(value => value > meanValue));
      const index = data.indexOf(maxValue);
      const angleIndexOffset = robotlib.utils.math.map(index, 0, 7, -30, 30);
      const angleIndexOffsetRad = robotlib.utils.math.deg2rad(angleIndexOffset);

      // FIXME rotate closer to can to avoid "finding" the wrong line?
      await motion.rotate(((Math.PI / 2) - angleIndexOffsetRad) * (passObstancleOnLeftSide ? -1 : 1));

      const heading = motion.getPose().phi;

      await motion.distanceHeading(200, heading);

      state = STATE_REDISCOVER_LINE;
    }
  }

  async function rediscoverLine(data) {
    if (!hasRediscoveredLine) {
      if (data.every(value => value < meanValue)) {
        const innerWheelSpeed = 100;
        const outerWheelSpeed = 250;
        const leftSpeed = passObstancleOnLeftSide ? outerWheelSpeed : innerWheelSpeed;
        const rightSpeed = passObstancleOnLeftSide ? innerWheelSpeed : outerWheelSpeed;

        motion.speedLeftRight(leftSpeed, rightSpeed);

        return;
      }

      hasRediscoveredLine = true;

      await motion.stop();

      state = STATE_ROTATE_TO_LINE;
    }
  }

  async function rotateToLine(data) {
    const maxValue = Math.max(...data.filter(value => value > meanValue));
    const index = data.indexOf(maxValue);
    const isRoughlyCenteredOnLine = index > 2 && index < 5;

    if (!isRoughlyCenteredOnLine) {
      const leftSpeed = config.MIN_SPEED * (passObstancleOnLeftSide ? -1 : 1);
      const rightSpeed = leftSpeed * -1;

      motion.speedLeftRight(leftSpeed, rightSpeed);
      return;
    }

    await motion.stop(true);

    state = STATE_LINE_FOLLOWING;
  }

  async function onLidarData({ angle, distance }) {
    if (withObstacle && state === STATE_LINE_FOLLOWING) {
      if (!distance) {
        return;
      }

      const inAngleRange = angle > 300 || angle < 60;
      const obstancleInSight = distance < 250;

      if (!obstacleDetected && inAngleRange && obstancleInSight) {
        obstacleDetected = true;

        await motion.stop(true);

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
      obstacleAvoiding(data);
    }

    if (withObstacle && state === STATE_REDISCOVER_LINE) {
      rediscoverLine(data);
    }

    if (withObstacle && state === STATE_ROTATE_TO_LINE) {
      rotateToLine(data);
    }
  }

  constructor();

  return {
    start,
    stop,
  };
};
