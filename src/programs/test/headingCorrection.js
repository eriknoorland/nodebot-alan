const robotlib = require('robotlib');
const scan = require('../../utils/sensor/lidar/scan');
const averageMeasurements = require('../../utils/sensor/lidar/averageMeasurements');
const solveStartVector = require('../../utils/motion/solveStartVector2');
const getInitialPosition = require('../../utils/motion/getInitialPosition');

const { pause } = robotlib.utils;
const { deg2rad } = robotlib.utils.math;

module.exports = (distance) => ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;
  const { lidar } = sensors;

  function constructor() {
    logger.log('constructor', 'testHeadingCorrection');
  }

  async function start() {
    logger.log('start', 'testHeadingCorrection');

    // simple test
    // motion.setTrackPose(true);
    // motion.appendPose({ x: 200, y: arena.height * 0.75, phi: 0 });
    // await motion.distanceHeading(distance, deg2rad(5));

    await solveStartVector(lidar, motion);
    await pause(250);

    const initialPositionScanData = await scan(lidar, 2000);
    const initialPositionAveragedMeasurements = averageMeasurements(initialPositionScanData);
    const { x, y } = getInitialPosition(initialPositionAveragedMeasurements, arena.height);

    motion.setTrackPose(true);
    motion.appendPose({ x, y, phi: 0 });

    await motion.rotate(deg2rad(5));
    await pause(1000);

    await motion.distanceHeading(distance, 0);

    testComplete();
  }

  function stop() {
    logger.log('stop', 'testHeadingCorrection');
    motion.stop(true);
  }

  function testComplete() {
    logger.log('test complete', 'testHeadingCorrection');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
