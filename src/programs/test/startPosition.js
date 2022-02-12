const EventEmitter = require('events');

module.exports = (centerOffset = 0) => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const { averageMeasurements } = utils.sensor.lidar;
  const { scan, startVector, gotoStartPosition } = helpers;
  const { motion } = actuators;

  async function start() {
    await startVector();

    const positionMeasurements = averageMeasurements(await scan(2000));
    await gotoStartPosition(positionMeasurements, centerOffset);

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
