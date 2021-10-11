module.exports = (numRotations = 1) => ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;

  function constructor() {
    logger.log('constructor', 'testRotation');
  }

  async function start() {
    logger.log('start', 'testRotation');

    let totalLeftTicks = 0;
    let totalRightTicks = 0;

    motion.on('odometry', ({ leftTicks, rightTicks }) => {
      totalLeftTicks += leftTicks;
      totalRightTicks += rightTicks;
    });

    console.log({
      WHEEL_BASE: config.WHEEL_BASE,
      LEFT_WHEEL_DIAMETER: config.LEFT_WHEEL_DIAMETER,
      RIGHT_WHEEL_DIAMETER: config.RIGHT_WHEEL_DIAMETER,
    });

    motion.setTrackPose(true);
    motion.appendPose({ x: 200, y: arena.height * 0.75, phi: 0 });

    await motion.rotate(numRotations * (Math.PI * 2));

    const targetDistance = Math.abs((config.WHEEL_BASE / 2) * (numRotations * (Math.PI * 2)));
    const leftDistanceTravelled = Math.abs(totalLeftTicks * config.LEFT_DISTANCE_PER_TICK);
    const rightDistanceTravelled = Math.abs(totalRightTicks * config.RIGHT_DISTANCE_PER_TICK);
    const leftDistanceDiff = leftDistanceTravelled - targetDistance;
    const rightDistanceDiff = rightDistanceTravelled - targetDistance;
    const distanceDiff = leftDistanceTravelled - rightDistanceTravelled;

    console.log({
      totalLeftTicks,
      totalRightTicks,
      targetDistance,
      leftDistanceTravelled,
      rightDistanceTravelled,
      distanceDiff,
      leftDistanceDiff,
      rightDistanceDiff,
    });

    testComplete();
  }

  function stop() {
    logger.log('stop', 'testRotation');
    motion.stop(true);
  }

  function testComplete() {
    logger.log('test complete', 'testRotation');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
