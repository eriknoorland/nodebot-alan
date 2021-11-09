module.exports = angle => ({ config, arena, logger, utils, helpers, controllers, sensors }) => {
  const { verifyRotation } = helpers;
  const { motion } = controllers;

  function constructor() {
    logger.log('constructor', 'testVerifyRotation');
  }

  async function start() {
    logger.log('start', 'testVerifyRotation');

    motion.setTrackPose(true);

    await verifyRotation(angle, 90);

    motion.setTrackPose(false);

    testComplete();
  }

  function stop() {
    logger.log('stop', 'testVerifyRotation');
    motion.stop(true);
  }

  function testComplete() {
    logger.log('test complete', 'testVerifyRotation');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
