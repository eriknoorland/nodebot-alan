module.exports = ({ config, arena, logger, utils, helpers, controllers }) => {
  const { startPosition, isWithinDistance } = helpers;
  const { motion } = controllers;

  function constructor() {
    logger.log('constructor', 'backAndForth');
  }

  async function start() {
    logger.log('start', 'backAndForth');

    await startPosition(arena.height);

    await motion.speedHeading(config.MAX_SPEED, 0, isWithinDistance(600, 0));
    await motion.stop();

    await motion.rotate(-Math.PI);

    await motion.speedHeading(config.MAX_SPEED, -Math.PI, isWithinDistance(600, 0));
    await motion.stop();

    missionComplete();
  }

  function stop() {
    logger.log('stop', 'backAndForth');
    motion.stop(true);
    motion.setTrackPose(false);
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
