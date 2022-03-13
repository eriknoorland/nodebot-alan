const EventEmitter = require('events');

module.exports = (distance, rotationDirection = 1) => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const { motion } = actuators;

  async function start() {
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
