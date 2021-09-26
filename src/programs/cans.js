const robotlib = require('robotlib');
const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const solveStartVector = require('../utils/motion/solveStartVector2');
const gotoStartPosition = require('../utils/motion/gotoStartPosition');
const getInitialPosition = require('../utils/motion/getInitialPosition');
const getArenaMatrix = require('../utils/getArenaMatrix');
const localiseCans = require('../utils/localiseCans');
const pickupCan = require('../utils/pickupCan');
const dropCan = require('../utils/dropCan');
const cellStates = require('../utils/cellStates');

const { pause } = robotlib.utils;
const { calculateDistance } = robotlib.utils.math;

module.exports = (pickupAndReturn = false) => ({ socket, config, arena, logger, controllers, sensors }) => {
  const { motion, gripper } = controllers;
  const { lidar } = sensors;
  const matrix = getArenaMatrix(arena.width, arena.height);
  const canStoreCoordinates = new Array(6)
    .fill(0)
    .map((v, index) => ({ x: 100, y: (arena.height / 2) + (150 * (index + 1)) }));

  let numStoredCans = 0;

  function constructor() {
    logger.log('constructor', 'cans');
  }

  async function start() {
    logger.log('start', 'cans');

    const arenaCenterPosition = {
      x: arena.width / 2,
      y: arena.height * 0.75,
    };

    await solveStartVector(lidar, motion);

    const startPositionScanData = await scan(lidar, 2000);
    const startPositionAveragedMeasurements = averageMeasurements(startPositionScanData);
    await gotoStartPosition(startPositionAveragedMeasurements, motion);

    const initialPositionScanData = await scan(lidar, 2000);
    const initialPositionAveragedMeasurements = averageMeasurements(initialPositionScanData);
    const initialPosition = getInitialPosition(initialPositionAveragedMeasurements, arena.height);

    motion.setTrackPose(true);
    motion.appendPose({ ...initialPosition, phi: 0 });

    /////

    const scanRadius = arena.width / 4;
    const scanPositions = [
      { ...initialPosition, heading: 0 },
      // { x: 1250, y: initialPosition.y, heading: 0 },
      // { x: 2050, y: initialPosition.y, heading: 0 },
      // { x: 2850, y: initialPosition.y, heading: 0 },
      // { x: 1800, y: 600, heading: -(Math.PI / 2) },
    ];

    for (let scanPositionIndex = 0; scanPositionIndex < scanPositions.length; scanPositionIndex += 1) {
      const scanPosition = scanPositions[scanPositionIndex];

      if (scanPositionIndex > 0) {
        await motion.move2XYPhi(scanPosition, scanPosition.heading);
        await pause(250);
      }

      const scanPose = motion.getPose();
      const obstacles = await localiseCans(scanRadius, matrix, scanPose, lidar);
      const sortedObstacles = [...obstacles].sort((a, b) => calculateDistance(scanPose, a) - calculateDistance(scanPose, b));

      // TODO check if sorting algorithm works

      sortedObstacles.forEach(({ row, column }) => matrix[row][column] = cellStates.OBSTACLE);

      matrix.forEach(row => console.log(row.toString()));

      for (let obstacleIndex = 0; obstacleIndex < sortedObstacles.length; obstacleIndex += 1) {
        const obstacle = sortedObstacles[obstacleIndex];

        // are we in square C?
        // if (scanPose.y <= arena.height / 2) {
        //   // add an extra point to navigate through so to now hit the wall
        //   await motion.move2XY(arenaCenterPosition);
        // }

        await motion.move2XY(obstacle, -config.GRIPPER_OBSTACLE_DISTANCE);

        try {
          await pickupCan(config, lidar, motion, gripper);
        } catch(error) {
          console.log('Nothing to see. Move along.');
          matrix[obstacle.row][obstacle.column] = cellStates.EMPTY;
          continue;
        }

        await motion.distanceHeading(-200, motion.getPose().phi);
        await pause(250);

        await motion.move2XY(canStoreCoordinates[numStoredCans], -config.GRIPPER_OBSTACLE_DISTANCE);
        await dropCan(config, gripper);

        await motion.distanceHeading(-150, motion.getPose().phi);
        await pause(250);

        matrix[obstacle.row][obstacle.column] = cellStates.EMPTY;
        numStoredCans += 1;
      };

      // check if we are done collecting up to 6 cans
      if (numStoredCans === 6 || scanPositionIndex === scanPositions.length - 1) {
        const currentPose = motion.getPose();

        // if not in square A - move back to square A
        if (currentPose.x > 600 ) {
          // are we in square C?
          if (currentPose.y <= arena.height / 2) {
            console.log('move to center square');
            // await motion.move2XY(arenaCenterPosition);
          }

          console.log('move to square A');
          // await motion.move2XY(initialPosition);
        }
      }
    };

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