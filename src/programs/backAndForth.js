const EventEmitter = require('events');

module.exports = () => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const { startPosition, isWithinDistance } = helpers;
  const { motion } = actuators;

  async function start() {
    await startPosition(arena.height);

    await motion.speedHeading(config.MAX_SPEED, 0, isWithinDistance(450, 0));
    await motion.stop();

    await motion.rotate(-Math.PI);

    await motion.speedHeading(config.MAX_SPEED, -Math.PI, isWithinDistance(450, 0));
    await motion.stop();

    eventEmitter.emit('mission_complete');
  }

  function stop() {
    motion.stop(true);
    motion.setTrackPose(false);
  }

  return {
    events: eventEmitter,
    start,
    stop,
  };
};
