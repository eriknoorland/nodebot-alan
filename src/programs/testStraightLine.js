module.exports = (distance, rotationDirection = 1) => ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;

  function constructor() {
    logger.log('constructor', 'testStraightLine');
  }

  async function start() {
    logger.log('start', 'testStraightLine');

    motion.setTrackPose(true);
    motion.appendPose({ x: 200, y: arena.height * 0.75, phi: 0 });

    const returnHeading = Math.PI * rotationDirection;

    await motion.distanceHeading(distance, 0);
    await motion.rotate(returnHeading);
    await motion.distanceHeading(distance, returnHeading);

    testComplete();
  }

  function stop() {
    logger.log('stop', 'testStraightLine');
    motion.stop(true);
  }

  function testComplete() {
    logger.log('test complete', 'testStraightLine');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
