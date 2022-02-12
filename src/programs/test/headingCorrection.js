const EventEmitter = require('events');

module.exports = (distance) => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const { pause } = utils.robotlib;
  const { deg2rad } = utils.robotlib.math;
  const { averageMeasurements } = utils.sensor.lidar;
  const { scan, startVector, getInitialPosition } = helpers;
  const { motion } = actuators;

  async function start() {
    // simple test
    // motion.setTrackPose(true);
    // motion.appendPose({ x: 200, y: arena.height * 0.75, phi: 0 });
    // await motion.distanceHeading(distance, deg2rad(5));

    await startVector();
    await pause(250);

    const initialPositionMeasurements = averageMeasurements(await scan(2000));
    const { x, y } = getInitialPosition(initialPositionMeasurements, arena.height);

    motion.setTrackPose(true);
    motion.appendPose({ x, y, phi: 0 });

    await motion.rotate(deg2rad(5));
    await pause(1000);

    await motion.distanceHeading(distance, 0);

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
