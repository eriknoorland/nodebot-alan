const isWithinDistance = require('../utils/sensor/lidar/isWithinDistance');
const solveStartVector = require('../utils/motion/solveStartVector');
const gotoStartPosition = require('../utils/motion/gotoStartPosition');

module.exports = ({ config, logger, controllers, sensors }) => {
  const { motion } = controllers;
  const { lidar } = sensors;

  function constructor() {
    logger.log('constructor', 'backAndForth');
  }

  async function start() {
    logger.log('start', 'backAndForth');

    // await solveStartVector(lidar, motion);

    // await gotoStartPosition(lidar, motion);
    // FIXME motion.appendPose({ x, y, phi: 0 });

    await motion.speedHeading(config.MAX_SPEED, 0, isWithinDistance(lidar, 750, 0));
    await motion.stop();
    await motion.rotate(-Math.PI);
    await motion.speedHeading(config.MAX_SPEED, -Math.PI, isWithinDistance(lidar, 750, 0));
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
