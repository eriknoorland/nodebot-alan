import EventEmitter from 'events';

export default () => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const { verifyPosition } = helpers;
  const { motion } = actuators;

  async function start() {
    motion.setTrackPose(true);

    await verifyPosition(arena, 0);

    motion.setTrackPose(false);

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
