const getArenaMatrix = require('../../utils/getArenaMatrix');
const localiseCans = require('../../utils/localiseCans');
const verifyPosition = require('../../helpers/verifyPosition');
const verifyRotation = require('../../helpers/verifyRotation');
const cellStates = require('../../utils/cellStates');

module.exports = ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;
  const { lidar } = sensors;

  function constructor() {
    logger.log('constructor', 'testCanDetection');
  }

  async function start() {
    logger.log('start', 'testCanDetection');

    const matrixResolution = 30;

    motion.setTrackPose(true);

    const scanRadius = 900;
    const matrix = getArenaMatrix(arena.width, arena.height, matrixResolution);

    await verifyRotation(lidar, motion, 90, 60);
    await verifyPosition(arena, lidar, motion, 0);

    const scanPose = motion.getPose();
    const localisedCans = await localiseCans(scanRadius, matrix, scanPose, lidar, matrixResolution);

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
