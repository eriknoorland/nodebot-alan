const robotlib = require('robotlib');
const getAngleDistance = require('../utils/sensor/lidar/getAngleDistance');
const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const isWithinDistance = require('../utils/sensor/lidar/isWithinDistance');
const solveStartVector = require('../utils/motion/solveStartVector2');
const gotoStartPosition = require('../utils/motion/gotoStartPosition');
const getInitialPosition = require('../utils/motion/getInitialPosition');
const verifyRotation = require('../helpers/verifyRotation');

const { pause } = robotlib.utils;
const { rad2deg, deg2rad, calculateDistance } = robotlib.utils.math;

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

    const startPositionScanData = await scan(lidar, 1000);
    const startPositionAveragedMeasurements = averageMeasurements(startPositionScanData);
    await gotoStartPosition(startPositionAveragedMeasurements, motion, startOffset);

    await verifyRotation(lidar, motion, 90, 60);

    const initialPositionScanData = await scan(lidar, 1000);
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
          isAtFirstCan = true;
          // console.log('findGap - is at first can');
        }

        if (isAtFirstCan) {
          if (!hasCounterStarted && maxDistance > 600) {
            hasCounterStarted = true;
            startPose = motion.getPose();
            // console.log('findGap - gap counter started');
          }

          if (hasCounterStarted) {
            const currentPose = motion.getPose();
            const distanceTravelled = calculateDistance(startPose, currentPose);
            // console.log({ distanceTravelled });

            if (distanceTravelled >= 95) {
              // console.log('findGap - gap found');
              clearInterval(interval);
              resolve();
              return;
            }

            // if (minDistance < 600 && distanceTravelled > 70) {
            if (minDistance < 600) {
              // console.log('findGap - gap counter reset');
              hasCounterStarted = false;
            }
          }
        }
      }, 10);
    });
  }

  async function moveThroughGap() {
    const crossingDistance = (startOffset * 2);
    const inAngle = (Math.PI / 2) * (side === 'left' ? -1 : 1);
    const outAngle = inAngle * -1;
    const inAngleAbsolute = inAngle < 0 ? 360 - Math.abs(rad2deg(inAngle)) : rad2deg(inAngle);

    const frontCanAngle = side === 'left' ? findFrontCanAngleLeft(inAngleAbsolute) : findFrontCanAngleRight(inAngleAbsolute);

    const angleDiff = frontCanAngle - inAngleAbsolute;
    const angleDiffRad = deg2rad(angleDiff);
    const remainingDistance = Math.abs(Math.sin(angleDiffRad) * lidarData[frontCanAngle]);
    const centerOffsetDistance = -(Math.abs(((240 / 2) - remainingDistance)) * 1.05);

    // console.log({ frontCanAngle, inAngleAbsolute, remainingDistance }, lidarData[frontCanAngle]);
    // console.log({ centerOffsetDistance });

    await pause(250);
    await motion.distanceHeading(centerOffsetDistance, heading);
    await pause(250);
    await motion.rotate(inAngle);
    await pause(250);
    await motion.distanceHeading(crossingDistance, heading + inAngle);
    await pause(250);
    await motion.rotate(outAngle);
    await pause(250);

    return Promise.resolve();
  }

  function findFrontCanAngleLeft(referenceAngle) {
    const frontCanAngle = Object
      .keys(lidarData)
      .map(angle => parseInt(angle, 10))
      .filter(angle => angle > referenceAngle && angle < referenceAngle + 60)
      .find(angle => lidarData[angle] < 600);

    return frontCanAngle;
  }

  function findFrontCanAngleRight(referenceAngle) {
    const reversedLidarData = [...Object.keys(lidarData)].reverse();
    const frontCanAngle = reversedLidarData.map(angle => parseInt(angle, 10))
      .filter(angle => angle < referenceAngle && angle > referenceAngle - 60)
      .find(angle => lidarData[angle] < 600);

    return frontCanAngle;
  }

  async function crossover() {
    const crossingDistance = (startOffset * 2);

    await motion.rotate(-Math.PI / 2);
    await pause(250);
    await motion.distanceHeading(crossingDistance, -Math.PI / 2);
    await pause(250);
    await motion.rotate(-Math.PI / 2);
    await pause(250);

    await verifyRotation(lidar, motion, 90, 60);
    await pause(250);

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
    } else {
      delete lidarData[Math.round(angle)];
    }
  }

  constructor();

  return {
    start,
    stop,
  };
};
