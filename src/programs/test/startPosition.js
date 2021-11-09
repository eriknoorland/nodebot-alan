module.exports = (centerOffset = 0) => ({ config, arena, logger, controllers, sensors }) => {
  const { averageMeasurements } = utils.sensor.lidar;
  const { scan, startVector, gotoStartPosition } = helpers;
  const { motion } = controllers;

  function constructor() {
    logger.log('constructor', 'testStartPosition');
  }

  async function start() {
    logger.log('start', 'testStartPosition');

    await startVector();

    const positionMeasurements = averageMeasurements(await scan(2000));
    await gotoStartPosition(positionMeasurements, centerOffset);

    testComplete();
  }

  function stop() {
    logger.log('stop', 'testStartPosition');
    motion.stop(true);
  }

  function testComplete() {
    logger.log('test complete', 'testStartPosition');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
