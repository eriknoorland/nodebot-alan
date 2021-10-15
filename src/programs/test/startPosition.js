const scan = require('../../utils/sensor/lidar/scan');
const averageMeasurements = require('../../utils/sensor/lidar/averageMeasurements');
const solveStartVector = require('../../utils/motion/solveStartVector2');
const gotoStartPosition = require('../../utils/motion/gotoStartPosition');

module.exports = (centerOffset = 0) => ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;
  const { lidar } = sensors;

  function constructor() {
    logger.log('constructor', 'testStartPosition');
  }

  async function start() {
    logger.log('start', 'testStartPosition');

    await solveStartVector(lidar, motion);

    const positionScanData = await scan(lidar, 2000);
    const positionAveragedMeasurements = averageMeasurements(positionScanData);
    await gotoStartPosition(positionAveragedMeasurements, motion, centerOffset);

    testComplete();
  }

  function stop() {
    logger.log('stop', 'testStartPosition');
    motion.stop(true);
  }

  function testComplete() {
    logger.log('test complete', 'testStartPosition');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
