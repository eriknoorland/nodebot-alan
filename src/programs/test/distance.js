module.exports = (distance) => ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;

  function constructor() {
    logger.log('constructor', 'testDistance');
  }

  async function start() {
    logger.log('start', 'testDistance');

    let totalLeftTicks = 0;
    let totalRightTicks = 0;

    motion.on('odometry', ({ leftTicks, rightTicks }) => {
      totalLeftTicks += leftTicks;
      totalRightTicks += rightTicks;
    });

    const startPose = { x: 200, y: arena.height * 0.75, phi: 0 };

    motion.setTrackPose(true);
    motion.appendPose(startPose);

    console.log(
      config.LEFT_WHEEL_DIAMETER,
      config.LEFT_WHEEL_CIRCUMFERENCE,
      config.LEFT_DISTANCE_PER_TICK,
      config.RIGHT_WHEEL_DIAMETER,
      config.RIGHT_WHEEL_CIRCUMFERENCE,
      config.RIGHT_DISTANCE_PER_TICK,
    );

    await motion.distanceHeading(distance, 0);

    const endPose = motion.getPose();
    const poseDiffX = endPose.x - startPose.x;

    console.log({
      totalLeftTicks,
      totalRightTicks,
      poseDiffX,
    });

    console.log('virtual distance left:', totalLeftTicks * config.LEFT_DISTANCE_PER_TICK);
    console.log('virtual distance right:', totalRightTicks * config.RIGHT_DISTANCE_PER_TICK);

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
