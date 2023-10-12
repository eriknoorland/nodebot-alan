const EventEmitter = require('events');

module.exports = () => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const { startPosition } = helpers;
  const { icp } = sensors;
  const { motion } = actuators;

  async function start() {
    await startPosition(arena.height);

    let heading = 0;
    console.log('[motion completed mark]', getPose());

    await motion.distanceHeading(1000, heading);
    console.log('[motion completed mark]', getPose());

    heading = Math.PI / 2;

    await motion.rotate(heading);
    console.log('[motion completed mark]', getPose());

    await motion.distanceHeading(200, heading);
    console.log('[motion completed mark]', getPose());

    heading = 0;

    await motion.rotate(heading);
    console.log('[motion completed mark]', getPose());

    await motion.distanceHeading(500, heading);
    console.log('[motion completed mark]', getPose());

    heading = Math.PI;

    await motion.rotate(heading);
    console.log('[motion completed mark]', getPose());

    await motion.distanceHeading(1000, heading);
    console.log('[motion completed mark]', getPose());

    eventEmitter.emit('mission_complete');
  }

  function stop() {
    motion.stop(true);
  }

  function getPose() {
    return {
      odom: motion.getPose(),
      icp: icp.getPose(),
    };
  }

  return {
    events: eventEmitter,
    start,
    stop,
  };
};
