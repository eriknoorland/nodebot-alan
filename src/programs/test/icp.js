const EventEmitter = require('events');

module.exports = () => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const { startPosition } = helpers;
  const { motion } = actuators;

  async function start() {
    await startPosition(arena.height);

    let heading = 0;
    console.log('[motion completed mark]');

    await motion.distanceHeading(1000, heading);
    console.log('[motion completed mark]');

    heading = Math.PI / 2;

    await motion.rotate(heading);
    console.log('[motion completed mark]');

    await motion.distanceHeading(200, heading);
    console.log('[motion completed mark]');

    heading = 0;

    await motion.rotate(heading);
    console.log('[motion completed mark]');

    await motion.distanceHeading(500, heading);
    console.log('[motion completed mark]');

    heading = Math.PI;

    await motion.rotate(heading);
    console.log('[motion completed mark]');

    await motion.distanceHeading(1000, heading);
    console.log('[motion completed mark]');

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
