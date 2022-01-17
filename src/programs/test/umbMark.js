const EventEmitter = require('events');

module.exports = (distance, rotationDirection = 1) => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const { pause } = utils.robotlib;
  const { motion } = controllers;

  async function start() {
    motion.setTrackPose(true);
    motion.appendPose({ x: 200, y: arena.height * 0.75, phi: 0 });

    await motion.distanceHeading(distance, 0);
    await pause(250);

    await motion.rotate((Math.PI / 2) * rotationDirection);
    await pause(250);
    await motion.distanceHeading(distance, (Math.PI / 2) * rotationDirection);
    await pause(250);

    await motion.rotate((Math.PI / 2) * rotationDirection);
    await pause(250);
    await motion.distanceHeading(distance, Math.PI * rotationDirection);
    await pause(250);

    await motion.rotate((Math.PI / 2) * rotationDirection);
    await pause(250);
    await motion.distanceHeading(distance, -(Math.PI / 2) * rotationDirection);
    await pause(250);

    await motion.rotate((Math.PI / 2) * rotationDirection);

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
