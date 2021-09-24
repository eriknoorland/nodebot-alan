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

module.exports = (pickupAndReturn = false) => ({ socket, config, arena, logger, controllers, sensors }) => {
  const { motion, gripper } = controllers;
  const { lidar } = sensors;
  const matrix = getArenaMatrix(arena.width, arena.height);
  const canStoreCoordinates = new Array(6)
    .fill(0)
    .map((v, index) => ({ x: 100, y: arena.height / 2 + (150 * (index + 1)) }));

  let numStoredCans = 0;

  function constructor() {
    logger.log('constructor', 'cans');
  }

  async function start() {
    logger.log('start', 'cans');

    await solveStartVector(lidar, motion);

    const startPositionScanData = await scan(lidar, 2000);
    const startPositionAveragedMeasurements = averageMeasurements(startPositionScanData);
    await gotoStartPosition(startPositionAveragedMeasurements, motion);

    const initialPositionScanData = await scan(lidar, 2000);
    const initialPositionAveragedMeasurements = averageMeasurements(initialPositionScanData);
    const { x, y } = getInitialPosition(initialPositionAveragedMeasurements, arena.height);

    motion.setTrackPose(true);
    motion.appendPose({ x, y, phi: 0 });

    /////

    const scanPositions = [
      { x: (arena.width / 6) - 150, y },
    ];

    scanPositions.forEach(async (scanPosition) => {
      await motion.move2XY(scanPosition); // await motion.move2XYPhi(scanPosition, 0);
      await robotlib.utils.pause(250);

      const scanPose = motion.getPose();
      const scanRadius = arena.width / 4;
      const obstacles = await localiseCans(scanRadius, matrix, scanPose, lidar);
      const sortedObstacles = [...obstacles].sort((a, b) =>{
        const distanceA = robotlib.utils.math.calculateDistance(scanPose, a);
        const distanceB = robotlib.utils.math.calculateDistance(scanPose, b);

        return distanceA - distanceB;
      });

      obstacles.forEach(({ row, column }) => matrix[row][column] = '-');

      console.log({ obstacles, sortedObstacles });
      matrix.forEach(row => console.log(row.toString()));

      for (let index = 0; index < obstacles.length; index += 1) {
        const obstacle = obstacles[index];

        await motion.move2XY(scanPosition); // TODO test if we can do without this call
        await robotlib.utils.pause(250);

        // are we in square C?
        // if (scanPose.y <= arena.height / 2) {
        //   add an extra point to navigate through so to now hit the wall
        // }

        await motion.move2XY(obstacle, -config.GRIPPER_OBSTACLE_DISTANCE);
        await pickupCan(config, lidar, motion, gripper);

        await motion.distanceHeading(-200, motion.getPose().phi);
        await robotlib.utils.pause(250);

        await motion.move2XY(canStoreCoordinates[numStoredCans], -config.GRIPPER_OBSTACLE_DISTANCE);
        await dropCan(config, gripper);

        await motion.distanceHeading(-150, motion.getPose().phi);
        await robotlib.utils.pause(250);

        matrix[obstacle.row][obstacle.column] = 2;
        numStoredCans += 1;
      };

      // numStoredCans === 6 OR at last scanPosition
      // if (numStoredCans === 6) {
      //   // if not in square A - move back to square A
      // }
    });

    // remember pose to get back to after fetching and returning every can (which is basically scanPose)
    // determine new scan position based on last scanPose and go there
    // repeat for center, B and C

    /////

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