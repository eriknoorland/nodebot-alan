
const robotlib = require('robotlib');const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const solveStartVector = require('../utils/motion/solveStartVector2');
const gotoStartPosition = require('../utils/motion/gotoStartPosition');
const getInitialPosition = require('../utils/motion/getInitialPosition');
const getAngleDistance = require('../utils/sensor/lidar/getAngleDistance');

const { pause } = robotlib.utils;

module.exports = (distance) => ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;
  const { lidar } = sensors;

  function constructor() {
    logger.log('constructor', 'testHeading');
  }

  async function start() {
    logger.log('start', 'testHeading');

    await solveStartVector(lidar, motion);
    await pause(250);

    // const startPositionScanData = await scan(lidar, 2000);
    // const startPositionAveragedMeasurements = averageMeasurements(startPositionScanData);
    // await gotoStartPosition(startPositionAveragedMeasurements, motion);

    const initialPositionScanData = await scan(lidar, 2000);
    const initialPositionAveragedMeasurements = averageMeasurements(initialPositionScanData);
    const { x, y } = getInitialPosition(initialPositionAveragedMeasurements, arena.height);
    const startRightDistance = getAngleDistance(initialPositionAveragedMeasurements, 90);

    motion.setTrackPose(true);
    motion.appendPose({ x, y, phi: 0 });
    const startPose = motion.getPose();

    await motion.distanceHeading(distance, 0);

    const endPositionScanData = await scan(lidar, 2000);
    const endPositionAveragedMeasurements = averageMeasurements(endPositionScanData);
    const endRightDistance = getAngleDistance(endPositionAveragedMeasurements, 90);
    const distanceDiff = endRightDistance - startRightDistance;
    const endPose = motion.getPose();
    const poseDiffX = endPose.x - startPose.x;
    const poseDiffY = endPose.y - startPose.y;

    console.log({
      startRightDistance,
      endRightDistance,
      distanceDiff,
      startPose,
      endPose,
      poseDiffX,
      poseDiffY,
    });

    testComplete();
  }

  function stop() {
    logger.log('stop', 'testHeading');
    motion.stop(true);
  }

  function testComplete() {
    logger.log('test complete', 'testHeading');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
