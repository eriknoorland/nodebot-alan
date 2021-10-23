const robotlib = require('robotlib');
const scan = require('../../utils/sensor/lidar/scan');
const averageMeasurements = require('../../utils/sensor/lidar/averageMeasurements');
const solveStartVector = require('../../utils/motion/solveStartVector2');
const getInitialPosition = require('../../utils/motion/getInitialPosition');

const { pause } = robotlib.utils;

module.exports = (distance) => ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;
  const { lidar } = sensors;

  function constructor() {
    logger.log('constructor', 'testHeadingCorrection');
  }

  async function start() {
    logger.log('start', 'testHeadingCorrection');

    await solveStartVector(lidar, motion);
    await pause(250);

    const initialPositionScanData = await scan(lidar, 2000);
    const initialPositionAveragedMeasurements = averageMeasurements(initialPositionScanData);
    const { x, y } = getInitialPosition(initialPositionAveragedMeasurements, arena.height);

    motion.setTrackPose(true);
    motion.appendPose({ x, y, phi: 0 });

    console.log('a', motion.getPose());

    await motion.rotate(Math.PI / 6);
    await pause(250);

    console.log('b', motion.getPose());

    await motion.distanceHeading(distance, 0);

    console.log('c', motion.getPose());

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
