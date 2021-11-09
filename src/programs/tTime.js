module.exports = (doNarrowPassage = false) => ({ config, arena, logger, utils, helpers, controllers, sensors }) => {
  const { pause } = utils.robotlib;
  const { startPosition, isWithinDistance, verifyRotation, narrowPassage } = helpers;
  const { motion } = controllers;

  function constructor() {
    logger.log('constructor', 'tTime');
  }

  async function start() {
    logger.log('start', 'tTime');

    await startPosition(arena.height, -350);

    // A -> B
    await motion.speedHeading(config.MAX_SPEED, 0, isWithinDistance(400, 0));
    await motion.stop();
    await pause(250);

    await motion.rotate(Math.PI);
    await pause(250);

    await verifyRotation(90, 60);
    await pause(250);

    // B -> C -> center
    await narrowPassage();

    // center -> A
    await motion.speedHeading(config.MAX_SPEED, Math.PI, isWithinDistance(400, 0));
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
