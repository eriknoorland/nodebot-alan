// const scan = require('../utils/sensor/lidar/scan');
// const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
// const isWithinDistance = require('../utils/sensor/lidar/isWithinDistance');
const solveStartVector = require('../utils/motion/solveStartVector2');

module.exports = ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;
  const { lidar } = sensors;

  function constructor() {
    logger.log('constructor', 'startVector');
  }

  async function start() {
    logger.log('start', 'startVector');

    // const startVectorScanData = await scan(lidar, 2000);
    // const startVectorAveragedMeasurements = averageMeasurements(startVectorScanData);
    // solveStartVectorHough(startVectorAveragedMeasurements, arena.height, 50, motion);

    await solveStartVector(lidar, motion);

    missionComplete();
  }

  function stop() {
    logger.log('stop', 'startVector');
    motion.stop(true);
  }

  function missionComplete() {
    logger.log('mission complete', 'startVector');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
