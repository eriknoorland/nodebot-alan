import EventEmitter from 'events';

export default (angle: number) => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const { verifyRotation } = helpers;
  const { motion } = actuators;

  async function start() {
    motion.setTrackPose(true);

    await verifyRotation(angle, 90);

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
