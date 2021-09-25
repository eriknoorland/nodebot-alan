module.exports = (distance, rotationDirection = 1) => ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;

  function constructor() {
    logger.log('constructor', 'testStraightLine');
  }

  async function start() {
    logger.log('start', 'testStraightLine');

    const returnHeading = Math.PI * rotationDirection;

    await motion.distanceHeading(distance, 0);
    await motion.rotate(returnHeading);
    await motion.distanceHeading(distance, returnHeading);

    missionComplete();
  }

  function stop() {
    logger.log('stop', 'testStraightLine');
    motion.stop(true);
  }

  function missionComplete() {
    logger.log('mission complete', 'testStraightLine');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
