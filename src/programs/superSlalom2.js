const robotlib = require('robotlib');
const getAngleDistance = require('../utils/sensor/lidar/getAngleDistance');
const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const isWithinDistance = require('../utils/sensor/lidar/isWithinDistance');
const solveStartVector = require('../utils/motion/solveStartVector2');
const gotoStartPosition = require('../utils/motion/gotoStartPosition');
const getInitialPosition = require('../utils/motion/getInitialPosition');

module.exports = ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;
  const { lidar } = sensors;
  const startOffset = 250;
  const lidarData = {};

  let heading = 0;
  let side = 'left';

  function constructor() {
    logger.log('constructor', 'superSlalom');
    lidar.on('data', onLidarData);
  }

  async function start() {
    logger.log('start', 'superSlalom');

    await solveStartVector(lidar, motion);

    const startPositionScanData = await scan(lidar, 2000);
    const startPositionAveragedMeasurements = averageMeasurements(startPositionScanData);
    await gotoStartPosition(startPositionAveragedMeasurements, motion, startOffset);

    const initialPositionScanData = await scan(lidar, 2000);
    const averagedMeasurements = averageMeasurements(initialPositionScanData);
    const { x, y } = getInitialPosition(averagedMeasurements, arena.height);

    motion.setTrackPose(true);
    motion.appendPose({ x, y, phi: heading });

    await findGap();
    await motion.stop();
    await moveThroughGap();
    side = 'right';
    await findGap();
    await motion.stop();
    await moveThroughGap();
    side = 'left';

    await motion.speedHeading(config.MAX_SPEED, heading, isWithinDistance(lidar, 400, 0));
    await motion.stop();

    await crossover();
    heading = -Math.PI;

    await findGap();
    await motion.stop();
    await moveThroughGap();
    side = 'right';
    await findGap();
    await motion.stop();
    await moveThroughGap();
    side = 'left';

    await motion.speedHeading(config.MAX_SPEED, heading, isWithinDistance(lidar, 400, 0));
    await motion.stop();

    missionComplete();
  }

  function findGap() {
    const referenceAngle = side === 'left' ? 270 : 90;
    let isAtFirstCan = false;
    let hasCounterStarted = false;
    let startPose;

    return new Promise(resolve => {
      motion.speedHeading(100, heading);

      const interval = setInterval(() => {
        const minDistance = getAngleDistance(lidarData, referenceAngle, 1);
        const maxDistance = getAngleDistance(lidarData, referenceAngle, 1, 'max');

        if (!isAtFirstCan && minDistance < 600) {
          console.log('findGap - is at first can');
          isAtFirstCan = true;
          // motion.speedHeading(100, heading);
        }

        if (isAtFirstCan) {
          if (!hasCounterStarted && maxDistance > 600) {
            console.log('findGap - gap counter started');
            hasCounterStarted = true;
            startPose = motion.getPose();
          }

          if (hasCounterStarted) {
            const currentPose = motion.getPose();
            const distanceTravelled = robotlib.utils.math.calculateDistance(startPose, currentPose);
            console.log({ distanceTravelled });

            if (distanceTravelled >= 100) {
              console.log('findGap - gap found');
              clearInterval(interval);
              resolve();
              return;
            }

            if (minDistance < 600 && distanceTravelled > 80) {
              console.log('findGap - gap counter reset');
              hasCounterStarted = false;
            }
          }
        }
      }, 20);
    });
  }

  async function moveThroughGap() {
    const canDiameter = 65;
    const crossingDistance = (startOffset * 2) + canDiameter;
    const inAngle = (Math.PI / 2) * (side === 'left' ? -1 : 1);
    const outAngle = inAngle * -1;

    await motion.rotate(inAngle);
    await motion.distanceHeading(crossingDistance, heading + inAngle);
    await motion.rotate(outAngle);

    return Promise.resolve();
  }

  async function crossover() {
    const canDiameter = 65;
    const crossingDistance = (startOffset * 2) + canDiameter;

    await motion.rotate(-Math.PI / 2);
    await motion.distanceHeading(crossingDistance, -Math.PI / 2);
    await motion.rotate(-Math.PI / 2);

    return Promise.resolve();
  }

  function stop() {
    logger.log('stop', 'superSlalom');
    motion.stop(true);
    lidar.off('data', onLidarData);
  }

  function missionComplete() {
    logger.log('mission complete', 'superSlalom');
    stop();
  }

  function onLidarData({ angle, distance }) {
    if (distance) {
      lidarData[Math.round(angle)] = distance;
    }
  }

  constructor();

  return {
    start,
    stop,
  };
};
