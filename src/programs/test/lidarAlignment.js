const EventEmitter = require('events');

module.exports = () => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const { deg2rad, rad2deg } = utils.robotlib.math;
  const { averageMeasurements, filterMeasurements } = utils.sensor.lidar;
  const { scan } = helpers;
  const { motion } = controllers;

  async function start() {
    logger.log('start', 'testLidarAlignment');

    const measurements = averageMeasurements(await scan(2000));
    const filteredMeasurements = filterMeasurements(measurements, a => a >= 45 && a <= 135);

    const points = Object
      .keys(filteredMeasurements)
      .map(angle => {
        const distance = filteredMeasurements[angle];
        const angleRad = deg2rad(parseInt(angle, 10));
        const x = Math.cos(angleRad) * distance;
        const y = Math.sin(angleRad) * distance;

        return { angle, distance, x, y };
      });

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const s = firstPoint.x - lastPoint.x;
    const o = firstPoint.y - lastPoint.y;
    const sin = Math.sin(o / s);

    console.log({ o, s, sin }, rad2deg(sin));

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
