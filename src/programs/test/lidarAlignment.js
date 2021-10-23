const robotlib = require('robotlib');
const scan = require('../../utils/sensor/lidar/scan');
const averageMeasurements = require('../../utils/sensor/lidar/averageMeasurements');
const filterMeasurements = require('../../utils/sensor/lidar/filterMeasurements');

const { deg2rad, rad2deg } = robotlib.utils.math;

module.exports = ({ config, arena, logger, controllers, sensors }) => {
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

    const points = Object
      .keys(filteredMeasurements)
      .map(angle => {
        const distance = filteredMeasurements[angle];
        const angleRad = deg2rad(parseInt(angle, 10));
        const x = Math.cos(angleRad) * distance;
        const y = Math.sin(angleRad) * distance;

        // console.log({ angle, /*distance, */posX, posY });
        return { angle, distance, x, y };
      });

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const s = firstPoint.x - lastPoint.x;
    const o = firstPoint.y - lastPoint.y;
    const sin = Math.sin(o / s);

    console.log({ o, s, sin }, rad2deg(sin));

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
