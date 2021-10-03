const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const narrowPassage = require('../helpers/narrowPassage');

module.exports = ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;
  const { lidar } = sensors;

  function constructor() {
    logger.log('constructor', 'testNarrowPassage');
  }

  async function start() {
    logger.log('start', 'testNarrowPassage');

    const scanData = await scan(lidar, 2000);
    const averagedScanData = averageMeasurements(scanData);

    await narrowPassage(motion, averagedScanData);

    testComplete();
  }

  function stop() {
    logger.log('stop', 'testNarrowPassage');
    motion.stop(true);
  }

  function testComplete() {
    logger.log('test complete', 'testNarrowPassage');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
