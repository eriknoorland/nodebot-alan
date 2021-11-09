module.exports = ({ config, arena, logger, utils, helpers, controllers, sensors }) => {
  const { getArenaMatrix, cellStates } = utils;
  const { verifyRotation, verifyPosition, localiseCans } = helpers;
  const { motion } = controllers;

  function constructor() {
    logger.log('constructor', 'testCanDetection');
  }

  async function start() {
    logger.log('start', 'testCanDetection');

    const matrixResolution = 30;

    motion.setTrackPose(true);

    const scanRadius = 900;
    const matrix = getArenaMatrix(arena.width, arena.height, matrixResolution);

    await verifyRotation(90, 60);
    await verifyPosition(arena, 0);

    const scanPose = motion.getPose();
    const localisedCans = await localiseCans(scanRadius, matrix, scanPose, matrixResolution);

    // mark matrix
    const pose = motion.getPose();
    const row = Math.floor(pose.y / matrixResolution);
    const column = Math.floor(pose.x / matrixResolution);

    matrix[row][column] = '|';
    localisedCans.forEach(({ row, column }) => matrix[row][column] = cellStates.OBSTACLE);

    // visualize
    matrix.forEach(row => console.log(row.toString()));

    testComplete();
  }

  function stop() {
    logger.log('stop', 'testCanDetection');
    motion.stop(true);
  }

  function testComplete() {
    logger.log('test complete', 'testCanDetection');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
