module.exports = (distance) => ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;

  function constructor() {
    logger.log('constructor', 'testDistance');
  }

  async function start() {
    logger.log('start', 'testDistance');

    motion.setTrackPose(true);
    motion.appendPose({ x: 200, y: arena.height * 0.75, phi: 0 });

    await motion.distanceHeading(distance, 0);

    testComplete();
  }

  function stop() {
    logger.log('stop', 'testDistance');
    motion.stop(true);
  }

  function testComplete() {
    logger.log('test complete', 'testDistance');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
