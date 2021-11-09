module.exports = ({ config, arena, logger, utils, helpers, controllers, sensors }) => {
  const { startVector } = helpers;
  const { motion } = controllers;

  function constructor() {
    logger.log('constructor', 'startVector');
  }

  async function start() {
    logger.log('start', 'startVector');

    await startVector();

    testComplete();
  }

  function stop() {
    logger.log('stop', 'startVector');
    motion.stop(true);
  }

  function testComplete() {
    logger.log('test complete', 'startVector');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
