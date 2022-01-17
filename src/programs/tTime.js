const EventEmitter = require('events');

module.exports = () => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const { pause } = utils.robotlib;
  const { startPosition, isWithinDistance, verifyRotation, narrowPassage } = helpers;
  const { motion } = actuators;

  async function start() {
    await startPosition(arena.height, -350);

    // A -> B
    await motion.speedHeading(config.MAX_SPEED, 0, isWithinDistance(400, 0));
    await motion.stop();
    await pause(250);

    await motion.rotate(Math.PI);
    await pause(250);

    await verifyRotation(90, 60);
    await pause(250);

    // B -> C -> center
    await narrowPassage();

    // center -> A
    await motion.speedHeading(config.MAX_SPEED, Math.PI, isWithinDistance(400, 0));
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
