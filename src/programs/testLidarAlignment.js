const robotlib = require('robotlib');
const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const filterMeasurements = require('../utils/sensor/lidar/filterMeasurements');

const { deg2rad } = robotlib.utils.math;

module.exports = (distance) => ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;
  const { lidar } = sensors;

  function constructor() {
    logger.log('constructor', 'testLidarAlignment');
  }

  async function start() {
    logger.log('start', 'testLidarAlignment');

    const scanData = await scan(lidar, 2000);
    const averagedMeasurements = averageMeasurements(scanData);
    const filteredMeasurements = filterMeasurements(averagedMeasurements, a => a >= 45 && a <= 135);

    Object
      .keys(filteredMeasurements)
      .forEach(angle => {
        const distance = filteredMeasurements[angle];
        const angleRad = deg2rad(parseInt(angle, 10));
        const posX = Math.cos(angleRad) * distance;
        const posY = Math.sin(angleRad) * distance;

        console.log({ angle, /*distance, */posX, posY });
      });

    // console.log('start wall right offset', filteredMeasurements[90]);

    // await motion.distanceHeading(distance, 0);

    // const endScanData = await scan(lidar, 2000);
    // const endAveragedMeasurements = averageMeasurements(endScanData);

    // console.log('end wall right offset', endAveragedMeasurements[90]);

    testComplete();
  }

  function stop() {
    logger.log('stop', 'testLidarAlignment');
    motion.stop(true);
  }

  function testComplete() {
    logger.log('test complete', 'testLidarAlignment');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
