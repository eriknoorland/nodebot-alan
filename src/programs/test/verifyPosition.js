const verifyPosition = require('../../helpers/verifyPosition');

module.exports = ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;
  const { lidar } = sensors;

  function constructor() {
    logger.log('constructor', 'testVerifyPosition');
  }

  async function start() {
    logger.log('start', 'testVerifyPosition');

    motion.setTrackPose(true);

    await verifyPosition(arena, lidar, motion, 0);

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
