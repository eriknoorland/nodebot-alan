// const robotlib = require('robotlib');
const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const filterMeasurements = require('../utils/sensor/lidar/filterMeasurements');
const solveStartVector = require('../utils/motion/solveStartVector2');
const gotoStartPosition = require('../utils/motion/gotoStartPosition');
const getInitialPosition = require('../utils/motion/getInitialPosition');
const getArenaMatrix = require('../utils/getArenaMatrix');
const obstacleDetection = require('../utils/sensor/lidar/obstacleDetection');

module.exports = (pickupAndReturn = false) => ({ socket, config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;
  const { lidar } = sensors;
  const matrix = getArenaMatrix(arena.width, arena.height);
  const detectedCans = [];

  function constructor() {
    logger.log('constructor', 'cans');
  }

  async function start() {
    logger.log('start', 'cans');

    console.log('num rows', matrix.length, 'num columns', matrix[0].length);

    // await solveStartVector(lidar, motion);

    // const startPositionScanData = await scan(lidar, 2000);
    // const startPositionAveragedMeasurements = averageMeasurements(startPositionScanData);
    // await gotoStartPosition(startPositionAveragedMeasurements, motion);

    const initialPositionScanData = await scan(lidar, 2000);
    const initialPositionAveragedMeasurements = averageMeasurements(initialPositionScanData);
    const { x, y } = getInitialPosition(initialPositionAveragedMeasurements, arena.height);

    motion.setTrackPose(true);
    motion.appendPose({ x, y, phi: 0 });

    // finding cans (repeatable, based on number of scan positions)
    const scanDistanceRadius = arena.height / 3;
    const distanceFilter = Math.sqrt(Math.pow(scanDistanceRadius, 2) + Math.pow(scanDistanceRadius, 2));
    const scanPose = motion.getPose();
    const scanData = await scan(lidar, 2000);
    const averagedMeasurements = averageMeasurements(scanData);
    const angleFilteredMeasurements = filterMeasurements(averagedMeasurements, a => a >= 270 || a <= 90);
    const distanceFilteredMeasurements = filterMeasurements(angleFilteredMeasurements, a => angleFilteredMeasurements[a] < Math.ceil(distanceFilter));
    const obstacles = obstacleDetection(matrix, scanPose, distanceFilteredMeasurements);

    obstacles.forEach(({ row, column }) => {
      matrix[row][column] = 3;
    });

    console.log({ scanDistanceRadius, distanceFilter });
    console.log({ obstacles });
    socket.emit('cans', obstacles);

    matrix.forEach(row => {
      console.log(row.toString());
    });

    // remember pose to get back to after fetching all obstacles
    // detectedCans.push({ x, y });
    // pick up and return cans in order of closest to furthest (repeatable, based on obstacles.length)
    // determine new scan position based on last scanPose and go there
    // repeat for center, B and C

    // drive back to start position

    missionComplete();
  }

  function stop() {
    logger.log('stop', 'cans');
  }

  function missionComplete() {
    logger.log('mission complete', 'cans');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};