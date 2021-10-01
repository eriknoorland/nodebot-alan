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

    motion.setTrackPose(true);
    motion.appendPose({ x: 200, y: arena.height * 0.75, phi: 0 });

    console.log(
      config.LEFT_WHEEL_DIAMETER,
      config.LEFT_WHEEL_CIRCUMFERENCE,
      config.LEFT_DISTANCE_PER_TICK,
      config.RIGHT_WHEEL_DIAMETER,
      config.RIGHT_WHEEL_CIRCUMFERENCE,
      config.RIGHT_DISTANCE_PER_TICK,
    );

    await motion.distanceCalibrationTest(distance);

    console.log({
      totalLeftTicks,
      totalRightTicks,
    });

    console.log('virtual distance left:', totalLeftTicks * config.LEFT_DISTANCE_PER_TICK);
    console.log('virtual distance right:', totalRightTicks * config.RIGHT_DISTANCE_PER_TICK);

    testComplete();
  }

  function loop() {
    return new Promise(resolve => {
      const interval = setInterval();
    });
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
