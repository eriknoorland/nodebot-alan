const robotlib = require('robotlib');
const { pause } = robotlib.utils;

module.exports = (distance, rotationDirection = 1) => ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;

  function constructor() {
    logger.log('constructor', 'testUMBMark');
  }

  async function start() {
    logger.log('start', 'testUMBMark');

    motion.setTrackPose(true);
    motion.appendPose({ x: 200, y: arena.height * 0.75, phi: 0 });

    await motion.distanceHeading(distance, 0);
    await pause(250);

    await motion.rotate((Math.PI / 2) * rotationDirection);
    await pause(250);
    await motion.distanceHeading(distance, (Math.PI / 2) * rotationDirection);
    await pause(250);

    await motion.rotate((Math.PI / 2) * rotationDirection);
    await pause(250);
    await motion.distanceHeading(distance, Math.PI * rotationDirection);
    await pause(250);

    await motion.rotate((Math.PI / 2) * rotationDirection);
    await pause(250);
    await motion.distanceHeading(distance, -(Math.PI / 2) * rotationDirection);
    await pause(250);

    await motion.rotate((Math.PI / 2) * rotationDirection);

    testComplete();
  }

  function stop() {
    logger.log('stop', 'testUMBMark');
    motion.stop(true);
  }

  function testComplete() {
    logger.log('test complete', 'testUMBMark');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
