module.exports = (numRotations = 1) => ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;

  function constructor() {
    logger.log('constructor', 'testRotation');
  }

  async function start() {
    logger.log('start', 'testRotation');

    await motion.rotate(numRotations * (Math.PI * 2));

    testComplete();
  }

  function stop() {
    logger.log('stop', 'testRotation');
    motion.stop(true);
  }

  function testComplete() {
    logger.log('test complete', 'testRotation');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
