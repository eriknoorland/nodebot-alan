module.exports = (distance, rotationDirection = 1) => ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;

  function constructor() {
    logger.log('constructor', 'testStraightLine');
  }

  async function start() {
    logger.log('start', 'testStraightLine');

    const startPose = {
      x: 200,
      y: arena.height * 0.75,
      phi: 0,
    };

    motion.setTrackPose(true);
    motion.appendPose(startPose);

    const returnHeading = Math.PI * rotationDirection;

    await motion.distanceHeading(distance, 0);
    await motion.rotate(returnHeading);
    await motion.distanceHeading(distance, returnHeading);

    const endPose = motion.getPose();
    const poseDiffX = endPose.x - startPose.x;
    const poseDiffY = endPose.y - startPose.y;

    console.log({
      startPose,
      endPose,
      poseDiffX,
      poseDiffY,
    });

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
