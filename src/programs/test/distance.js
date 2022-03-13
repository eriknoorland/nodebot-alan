const EventEmitter = require('events');

module.exports = (distance) => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const { motion } = actuators;

  async function start() {
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

    eventEmitter.emit('mission_complete');
  }

  function stop() {
    motion.stop(true);
  }

  return {
    events: eventEmitter,
    start,
    stop,
  };
};
