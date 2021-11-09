module.exports = ({ config, arena, logger, utils, helpers, controllers, sensors }) => {
  const { verifyPosition } = helpers;
  const { motion } = controllers;
  const { lidar } = sensors;

  function constructor() {
    logger.log('constructor', 'testVerifyPosition');
  }

  async function start() {
    logger.log('start', 'testVerifyPosition');

    motion.setTrackPose(true);

    await verifyPosition(arena, 0);

    motion.setTrackPose(false);

    testComplete();
  }

  function stop() {
    logger.log('stop', 'testVerifyPosition');
    motion.stop(true);
  }

  function testComplete() {
    logger.log('test complete', 'testVerifyPosition');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
