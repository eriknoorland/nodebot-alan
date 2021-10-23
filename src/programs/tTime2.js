const robotlib = require('robotlib');
const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const solveStartVector = require('../utils/motion/solveStartVector2');
const gotoStartPosition = require('../utils/motion/gotoStartPosition');
const getInitialPosition = require('../utils/motion/getInitialPosition');
const isWithinDistance = require('../utils/sensor/lidar/isWithinDistance');
const narrowPassage = require('../helpers/narrowPassage2');
const verifyRotation = require('../helpers/verifyRotation');

const { pause } = robotlib.utils;

module.exports = (doNarrowPassage = false) => ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;
  const { lidar } = sensors;

  function constructor() {
    logger.log('constructor', 'tTime');
  }

  async function start() {
    logger.log('start', 'tTime');

    await solveStartVector(lidar, motion);
    await pause(250);

    const startPositionScanData = await scan(lidar, 2000);
    const startPositionAveragedMeasurements = averageMeasurements(startPositionScanData);
    await gotoStartPosition(startPositionAveragedMeasurements, motion, -350);

    await verifyRotation(lidar, motion, 90, 60);
    await pause(250);

    const initialPositionScanData = await scan(lidar, 2000);
    const averagedMeasurements = averageMeasurements(initialPositionScanData);
    const { x, y } = getInitialPosition(averagedMeasurements, arena.height);

    motion.setTrackPose(true);
    motion.appendPose({ x, y, phi: 0 });

    await motion.rotate(-Math.PI);
    await pause(250);

    await verifyRotation(lidar, motion, 90, 60);
    await pause(250);

    // A -> B (in reverse)
    await motion.speedHeading(-config.MAX_SPEED, Math.PI, isWithinDistance(lidar, 400, 180));
    await motion.stop();
    await pause(250);

    await verifyRotation(lidar, motion, 90, 60);
    await pause(250);

    // B -> C -> center
    await narrowPassage(config, lidar, motion);

    // center -> A
    await motion.speedHeading(config.MAX_SPEED, Math.PI, isWithinDistance(lidar, 400, 0));
    await motion.stop();

    missionComplete();
  }

  function stop() {
    logger.log('stop', 'tTime');
    motion.stop(true);
  }

  function missionComplete() {
    logger.log('mission complete', 'tTime');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
