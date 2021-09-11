const robotlib = require('robotlib');

module.exports = (withObstacle = false) => ({ config, logger, controllers, sensors }) => {
  const STATE_IDLE = 'idle';
  const STATE_CALIBRATION = 'calibration';
  const STATE_LINE_FOLLOWING = 'lineFollowing';
  const STATE_OBSTACLE_AVOIDANCE = 'obstacleAvoidance';
  const STATE_DONE = 'done';

  const { motion } = controllers;
  const { lidar, line: lineSensor } = sensors;
  const calibrationData = [];
  const maxSpeed = 300;
  const speed = maxSpeed - 100;
  const Kp = 40;

  let numTimesBelowThreshold = 0;
  let state = STATE_IDLE;
  let minValue;
  let maxValue;
  let meanValue;

  function constructor() {
    logger.log('constructor', 'lineFollowerObstacle');
  }

  function start() {
    if (withObstacle) {
      lidar.on('data', onLidarData);
    }

    lineSensor.on('data', onLineData);
    setTimeout(calibrate, 1000);
  }

  function stop() {
    state = STATE_DONE;

    if (withObstacle) {
      lidar.off('data', onLidarData);
    }

    lineSensor.off('data', onLineData);
    motion.stop();
  }

  function missionComplete() {
    logger.log('mission complete', 'lineFollowerObstacle');
    stop();
  }

  async function calibrate() {
    const rotationOffset = 20;

    state = STATE_CALIBRATION;

    await motion.rotate(robotlib.utils.math.deg2rad(-rotationOffset));
    await motion.rotate(robotlib.utils.math.deg2rad(rotationOffset * 2));
    await motion.rotate(robotlib.utils.math.deg2rad(-rotationOffset));

    minValue = Math.min(...calibrationData);
    maxValue = Math.max(...calibrationData);
    meanValue = (minValue + maxValue) / 2;

    state = STATE_LINE_FOLLOWING;
  }

  function lineFollowing(data) {
    // TODO maybe also include position in starting area when start position can be confirmed?
    if (data.every(value => value < meanValue)) {
      return ++numTimesBelowThreshold <= 20;
    }

    const maxValue = Math.max(...data);
    const index = data.indexOf(maxValue);
    const error = index - 3.5;
    const leftSpeed = robotlib.utils.constrain(Math.round(speed + (error * Kp)), 0, maxSpeed);
    const rightSpeed = robotlib.utils.constrain(Math.round(speed - (error * Kp)), 0, maxSpeed);

    motion.speedLeftRight(leftSpeed, rightSpeed);
    numTimesBelowThreshold = 0;

    return true;
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

    if (withObstacle && state == STATE_OBSTACLE_AVOIDANCE) {
      // do something
      // when done, state = STATE_LINE_FOLLOWING
    }
  }

  function onLidarData(data) {
    // check if object in x mm perimeter
    // if true, state = STATE_OBSTACLE_AVOIDANCE
  }

  constructor();

  return {
    start,
    stop,
  };
};
