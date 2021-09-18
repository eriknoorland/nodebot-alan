const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const isWithinDistance = require('../utils/sensor/lidar/isWithinDistance');
const getAngleDistance = require('../utils/sensor/lidar/getAngleDistance');
const solveStartVector = require('../utils/motion/solveStartVector2');
const gotoStartPosition = require('../utils/motion/gotoStartPosition');
const getInitialPosition = require('../utils/motion/getInitialPosition');
const robotlib = require('robotlib');

module.exports = ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;
  const { lidar } = sensors;
  const lidarData = {};
  const startOffset = 250;
  let heading = 0;

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

    await slalom('Left');
    await slalom('Right');
    await motion.speedHeading(config.MAX_SPEED, heading, isWithinDistance(lidar, 500, 0));
    await motion.stop();
    await crossover();

    // remember distances from a -> B to be used in reverse from B -> A?

    await slalom('Left');
    await slalom('Right');
    await motion.speedHeading(config.MAX_SPEED, heading, isWithinDistance(lidar, 500, 0));
    await motion.stop();

    missionComplete();
  }

  async function slalom(side) {
    const referenceAngle = side === 'Left' ? 270 : 90;
    const referenceDistance = getAngleDistance(lidarData, referenceAngle, 2);
    const targetGapWidth = 200 + 40;

    await findGap(side, targetGapWidth, referenceDistance);
    await moveThroughGap(side, targetGapWidth);

    return Promise.resolve();
  }

  function driveToNextCan(referenceDistance, angle) {
    let canDistance = referenceDistance;
    let isAtNextCan = false;

    const interval = setInterval(() => {
      const angleDistance = getAngleDistance(lidarData, angle, 2);

      if (angleDistance && angleDistance < (referenceDistance / 2)) {
        clearInterval(interval);
        canDistance = Math.min(canDistance, angleDistance);
        isAtNextCan = true;
      }
    }, 30);

    return () => isAtNextCan;
  }

  async function findGap(side, targetGapWidth, referenceDistance, count = 0) {
    console.log('findGap', { side, targetGapWidth, referenceDistance, count });
    const checkAngle = side === 'Left' ? 270 : 90;

    if (count) {
      // await motion.distanceHeading(100, heading);
      await motion.distanceHeading(40, heading);
    }

    await motion.speedHeading(200, heading, driveToNextCan(referenceDistance, checkAngle));

    if (checkForGap(side, targetGapWidth, referenceDistance)) {
      return Promise.resolve();
    }

    return findGap(side, targetGapWidth, referenceDistance, count + 1);
  }

  function checkForGap(side, targetGapWidth, referenceDistance) {
    console.log('checkForGap', { side, targetGapWidth, referenceDistance });
    const getGapSize = (measuredS, correctedAngle) => {
      if (measuredS) {
        const referenceS = referenceDistance / Math.cos(robotlib.utils.math.deg2rad(correctedAngle));

        console.log('getGapSize', { referenceS, measuredS, correctedAngle });

        if (measuredS < (referenceS / 2)) {
          return (Math.sin(robotlib.utils.math.deg2rad(correctedAngle)) * measuredS);
        }
      }

      return 0;
    };

    const checkAngles = (measurements) => {
      const filteredMeasurements = Object.keys(measurements)
        .filter((key) => (side === 'Left' ? key >= 290 : key <= 70))
        .reduce((acc, key) => {
          acc[key] = measurements[key];
          return acc;
        }, {});

      const numMeasurements = Object.keys(filteredMeasurements).length;

      if (side === 'Left') {
        for (let angle = 290; angle < 290 + numMeasurements; angle += 1) {
          const gapSize = getGapSize(filteredMeasurements[angle], angle - 270);

          if (gapSize) {
            logger.log(`obstacle at ${angle}° with a size of ${gapSize.toFixed(2)}mm`, 'superSlalom');
            return gapSize;
          }
        }
      } else {
        for (let angle = 70; angle >= 0; angle -= 1) {
          const gapSize = getGapSize(filteredMeasurements[angle], 90 - angle);

          if (gapSize) {
            logger.log(`obstacle at ${angle}° with a size of ${gapSize.toFixed(2)}mm`, 'superSlalom');
            return gapSize;
          }
        }
      }

      return 0;
    };

    const gapSize = checkAngles(lidarData);

    return gapSize > 180; // targetGapWidth / 2;
  }

  async function moveThroughGap(side, targetGapWidth) {
    const canDiameter = 65;
    const inAngle = (Math.PI / 2) * (side === 'Left' ? -1 : 1);
    const outAngle = inAngle * -1;
    const obstacleAngle = side === 'Left' ? 270 : 90;
    const obstacleDistance = getAngleDistance(lidarData, obstacleAngle, 2);
    const crossingDistance = Math.round((obstacleDistance * 2) + canDiameter);
    const gapCenter = Math.ceil((canDiameter / 2) + (targetGapWidth / 2)) + 15;

    await motion.distanceHeading(gapCenter, heading);
    await motion.rotate(inAngle);
    await motion.distanceHeading(crossingDistance, heading + inAngle);
    await motion.rotate(outAngle);

    return Promise.resolve();
  }

  async function crossover() {
    const distanceRight = getAngleDistance(lidarData, 90, 2);
    const distanceLeft = getAngleDistance(lidarData, 270, 2);
    const distanceFromCenter = (distanceLeft - distanceRight) / 2;
    const crossingDistance = Math.ceil(startOffset + distanceFromCenter);

    await motion.rotate(-Math.PI / 2);
    await motion.distanceHeading(crossingDistance, -Math.PI / 2);
    await motion.rotate(-Math.PI / 2);

    heading = -Math.PI;

    return Promise.resolve();
  }

  function onLidarData({ angle, distance }) {
    const a = Math.round(angle);

    if (distance) {
      lidarData[a % 360] = distance;
    }
  }

  function stop() {
    logger.log('stop', 'superSlalom');
    lidar.off('data', onLidarData);
    motion.stop(true);
  }

  function missionComplete() {
    logger.log('mission complete', 'superSlalom');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
