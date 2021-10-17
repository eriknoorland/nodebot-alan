const verifyRotation = require('../../helpers/verifyRotation');

module.exports = angle => ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;
  const { lidar } = sensors;

  function constructor() {
    logger.log('constructor', 'testVerifyRotation');
  }

  async function start() {
    logger.log('start', 'testVerifyRotation');

    motion.setTrackPose(true);

    await verifyRotation(lidar, motion, angle, 90);

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
