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

    const scanPositions = [
      { x: 450, y: 1800, heading: 0 },
      { x: 1250, y: 1800, heading: 0 },
      { x: 2050, y: 1800, heading: 0 },
      { x: 2850, y: 1800, heading: 0 },
      { x: 1800, y: 1100, heading: -(Math.PI / 2) },
      { x: 1800, y: 600, heading: -(Math.PI / 2) },
    ];

    const scanPosition = scanPositions[2];
    const scanRadius = 900;
    const scanPose = { ...scanPosition, phi: scanPosition.heading };
    const matrix = getArenaMatrix(arena.width, arena.height);

    console.log(motion.getPose());
    await verifyRotation(lidar, motion, 90, 60);
    await verifyPosition(arena, lidar, motion, 0);
    console.log(motion.getPose());

    const localisedCans = await localiseCans(scanRadius, matrix, scanPose, lidar);

    console.log(localisedCans);

    // mark cans in matrix
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
