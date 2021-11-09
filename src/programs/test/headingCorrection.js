module.exports = (distance) => ({ config, arena, logger, utils, helpers, controllers, sensors }) => {
  const { pause } = utils.robotlib;
  const { deg2rad } = utils.robotlib.math;
  const { averageMeasurements } = utils.sensor.lidar;
  const { scan, startVector, getInitialPosition } = helpers;
  const { motion } = controllers;

  function constructor() {
    logger.log('constructor', 'testHeadingCorrection');
  }

  async function start() {
    logger.log('start', 'testHeadingCorrection');

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

    testComplete();
  }

  function stop() {
    logger.log('stop', 'testHeadingCorrection');
    motion.stop(true);
  }

  function testComplete() {
    logger.log('test complete', 'testHeadingCorrection');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
