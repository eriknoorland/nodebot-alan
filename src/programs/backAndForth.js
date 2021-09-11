const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const isWithinDistance = require('../utils/sensor/lidar/isWithinDistance');
const solveStartVector = require('../utils/motion/solveStartVector2');
const gotoStartPosition = require('../utils/motion/gotoStartPosition');
const getInitialPosition = require('../utils/motion/getInitialPosition');

module.exports = ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;
  const { lidar } = sensors;

  function constructor() {
    logger.log('constructor', 'backAndForth');
  }

  async function start() {
    logger.log('start', 'backAndForth');

    // const startVectorScanData = await scan(lidar, 2000);
    // const startVectorAveragedMeasurements = averageMeasurements(startVectorScanData);
    // solveStartVectorHough(startVectorAveragedMeasurements, arena.height, 50, motion);

    await solveStartVector(lidar, motion);

    const startPositionScanData = await scan(lidar, 2000);
    const startPositionAveragedMeasurements = averageMeasurements(startPositionScanData);
    await gotoStartPosition(startPositionAveragedMeasurements, motion);

    const initialPositionScanData = await scan(lidar, 2000);
    const averagedMeasurements = averageMeasurements(initialPositionScanData);
    const { x, y } = getInitialPosition(averagedMeasurements, arena.height);

    motion.setTrackPose(true);
    motion.appendPose({ x, y, phi: 0 });

    await motion.speedHeading(config.MAX_SPEED, 0, isWithinDistance(lidar, 600, 0));
    await motion.stop();
    await motion.rotate(-Math.PI);
    await motion.speedHeading(config.MAX_SPEED, -Math.PI, isWithinDistance(lidar, 600, 0));
    await motion.stop();

    missionComplete();
  }

  function stop() {
    logger.log('stop', 'backAndForth');
    motion.stop(true);
  }

  function missionComplete() {
    logger.log('mission complete', 'backAndForth');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
