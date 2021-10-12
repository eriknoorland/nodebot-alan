const robotlib = require('robotlib');
const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const solveStartVector = require('../utils/motion/solveStartVector2');
const gotoStartPosition = require('../utils/motion/gotoStartPosition');
const getInitialPosition = require('../utils/motion/getInitialPosition');
const getArenaMatrix = require('../utils/getArenaMatrix');
const localiseCans = require('../utils/localiseCans');
const locateCan = require('../utils/locateCan');
const pickupCan = require('../utils/pickupCan');
const dropCan = require('../utils/dropCan');
const cellStates = require('../utils/cellStates');

const { pause } = robotlib.utils;
const { calculateDistance } = robotlib.utils.math;

module.exports = (pickupAndReturn = false) => ({ socket, config, arena, logger, controllers, sensors }) => {
  const { motion, gripper } = controllers;
  const { lidar } = sensors;
  const matrix = getArenaMatrix(arena.width, arena.height);
  const halfArenaHeight = arena.height / 2;
  const maxNumCans = 6;
  const canStoreCoordinates = [
    { x: 100, y: 150 + halfArenaHeight },
    { x: 200, y: 150 + halfArenaHeight },
    { x: 300, y: 150 + halfArenaHeight },
    { x: 100, y: 250 + halfArenaHeight },
    { x: 200, y: 250 + halfArenaHeight },
    { x: 300, y: 250 + halfArenaHeight },
  ];

  const endPosition = { x: 200, y: arena.height * 0.75 };

  const arenaCenterPosition = {
    x: arena.width / 2,
    y: arena.height * 0.75,
  };

  let numStoredCans = 0;

  function constructor() {
    logger.log('constructor', 'cans');
  }

  async function start() {
    logger.log('start', 'cans');

    await verifyPosition();

    const startPosition = { ...initialPosition };

    if (startPosition.x < 450) {
      startPosition.x = 450;
    }

    const scanRadius = arena.width / 4;
    const scanPositions = [
      { ...startPosition, heading: 0 },
      { x: 1250, y: initialPosition.y, heading: 0 },
      { x: 2050, y: initialPosition.y, heading: 0 },
      { x: 2850, y: initialPosition.y, heading: 0 },
      // { x: 1800, y: 600, heading: -(Math.PI / 2) },
    ];

    for (let scanPositionIndex = 0; scanPositionIndex < scanPositions.length; scanPositionIndex += 1) {
      const scanPosition = scanPositions[scanPositionIndex];
      const isAtLastScanPosition = scanPositionIndex === scanPositions.length - 1;
      const inSquareC = scanPosition.y < halfArenaHeight;

      if (scanPositionIndex > 0) {
        if (inSquareC) {
          await motion.move2XY(arenaCenterPosition);
          await pause(250);
        }

        await motion.move2XYPhi(scanPosition, scanPosition.heading);
        await pause(250);
      }

      const scanPose = motion.getPose();
      const localisedCans = await localiseCans(scanRadius, matrix, scanPose, lidar);
      const sortedLocalisedCans = [...localisedCans].sort((a, b) => calculateDistance(scanPose, a) - calculateDistance(scanPose, b));

      sortedLocalisedCans.forEach(({ row, column }) => matrix[row][column] = cellStates.OBSTACLE);

      // TODO visualize cans in telemetry?

      // visualize the matrix
      matrix.forEach(row => console.log(row.toString()));

      console.log(`${localisedCans.length} can(s) found at scan position ${scanPosition.x},${scanPosition.y}`);

      for (let obstacleIndex = 0; obstacleIndex < sortedLocalisedCans.length; obstacleIndex += 1) {
        const obstacle = sortedLocalisedCans[obstacleIndex];

        if (inSquareC) {
          await motion.move2XY(arenaCenterPosition);
          await pause(250);
        }

        await motion.move2XY(obstacle, -config.GRIPPER_OBSTACLE_DISTANCE);
        await pause(250);

        if (pickupAndReturn) {
          try {
            await pickupCan(config, lidar, motion, gripper);
          } catch(error) {
            console.log(error);
            matrix[obstacle.row][obstacle.column] = cellStates.EMPTY;
            continue;
          }

          await motion.distanceHeading(-200, motion.getPose().phi);
          await pause(250);

          if (inSquareC) {
            await motion.move2XY(arenaCenterPosition);
            await pause(250);
          }

          await motion.move2XY(canStoreCoordinates[numStoredCans], -config.GRIPPER_OBSTACLE_DISTANCE);
          await dropCan(config, gripper);

          await motion.distanceHeading(-150, motion.getPose().phi);
          await pause(250);
        } else {
          try {
            await locateCan(config, lidar);
          } catch(error) {
            console.log(error);
            matrix[obstacle.row][obstacle.column] = cellStates.EMPTY;
          }

          await gripper.setJawAngle(config.GRIPPER_JAW_WIDE_OPEN_ANGLE);
          await gripper.setJawAngle(config.GRIPPER_JAW_OPEN_ANGLE);

          // give "someone" the time to remove the can
          await pause(5000);
        }

        matrix[obstacle.row][obstacle.column] = cellStates.EMPTY;
        numStoredCans += 1;

        if (numStoredCans < maxNumCans && !isAtLastScanPosition && numStoredCans % 2 === 0) {
          await verifyPosition(startPosition);
        }
      };

      if (numStoredCans === maxNumCans || isAtLastScanPosition) {
        const currentPose = motion.getPose();
        const inSquareA = currentPose.x < 500;
        const currentlyInSquareC = currentPose.y <= halfArenaHeight;

        if (!inSquareA) {
          if (currentlyInSquareC) {
            console.log('move to center square');
            await motion.move2XY(arenaCenterPosition);
          }

          console.log('move to square A');
          await motion.move2XY(endPosition);
        }
      }
    }

    missionComplete();
  }

  async function verifyPosition(startPosition = null) {
    if (startPosition) {
      await motion.move2XY(startPosition);

      motion.setTrackPose(false);
    }

    await solveStartVector(lidar, motion);

    const positionScanData = await scan(lidar, 2000);
    const positionAveragedMeasurements = averageMeasurements(positionScanData);
    await gotoStartPosition(positionAveragedMeasurements, motion);

    const currentPositionScanData = await scan(lidar, 2000);
    const currentPositionAveragedMeasurements = averageMeasurements(currentPositionScanData);
    const position = getInitialPosition(currentPositionAveragedMeasurements, arena.height);

    motion.setTrackPose(true);
    motion.appendPose({ ...position, phi: 0 });

    return Promise.resolve();
  }

  function stop() {
    logger.log('stop', 'cans');
    motion.stop(true);
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
