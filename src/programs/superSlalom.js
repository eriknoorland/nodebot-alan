const config = require('../config');
const rotate = require('../utils/motion/rotate');
const solveStartVector = require('../utils/solveStartVector');
const gotoStartPosition = require('../utils/motion/gotoStartPosition');
const driveStraightUntil = require('../utils/motion/driveStraightUntil');
const isWithinDistance = require('../utils/sensor/lidar/isWithinDistance');
const getAngleDistance = require('../utils/sensor/lidar/getAngleDistance');

module.exports = ({ logger, controllers, sensors }) => {
  const { robot, speed, obstacles } = config;
  const { main } = controllers;
  const { lidar } = sensors;
  const lidarData = {};
  const startOffset = 20;

  function constructor() {
    logger.log('constructor', 'superSlalom');
    lidar.on('data', onLidarData);
  }

  async function start() {
    const driveToEndCondition = isWithinDistance.bind(null, lidar, obstacles.wall.close, 0);

    await solveStartVector(lidar, main);
    await gotoStartPosition(lidar, main, startOffset);
    await slalom('Left');
    await slalom('Right');
    await driveStraightUntil(speed.straight.medium, main, driveToEndCondition);
    await main.stop();
    await crossover();
    await slalom('Left');
    await slalom('Right');
    await driveStraightUntil(speed.straight.medium, main, driveToEndCondition);
    await main.stop();

    missionComplete();
  }

  async function slalom(side) {
    const referenceAngle = side === 'Left' ? 270 : 90;
    const referenceDistance = getAngleDistance(lidarData, referenceAngle);
    const targetGapWidth = robot.diameter + config.distance.gap.width;

    await findGap(side, targetGapWidth, referenceDistance);
    await moveThroughGap(side, targetGapWidth);

    return Promise.resolve();
  }

  function driveToNextCan(referenceDistance, angle) {
    let canDistance = referenceDistance;

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const angleDistance = getAngleDistance(lidarData, angle, 2);

        if (angleDistance && angleDistance < (referenceDistance - 100)) {
          canDistance = Math.min(canDistance, angleDistance);
          clearInterval(interval);
          resolve();
        }
      }, 30);
    });
  }

  async function findGap(side, targetGapWidth, referenceDistance, count = 0) {
    const driveSpeed = count ? speed.straight.slow : speed.straight.medium;
    const checkAngle = side === 'Left' ? 270 : 90;
    const driveStraightCondition = driveToNextCan.bind(null, referenceDistance, checkAngle);

    if (!count) {
      setTimeout(() => {
        main.setLedColor.apply(null, config.color.red);
      }, 0);
    }

    await driveStraightUntil(driveSpeed, main, driveStraightCondition);

    if (await checkForGap(side, referenceDistance)) {
      setTimeout(() => {
        main.setLedColor.apply(null, config.color.green);
      }, 0);

      await main.moveForward(driveSpeed, 1);

      return Promise.resolve();
    }

    return findGap(side, targetGapWidth, referenceDistance, count + 1);
  }

  async function checkForGap(side, referenceDistance) {
    const getGapSize = (data, angle, correctedAngle) => {
      const measuredS = data[angle]; // mm

      if (measuredS) {
        const referenceS = referenceDistance / Math.cos(correctedAngle * (Math.PI / 180)); // mm

        if (measuredS < (referenceS - 100)) {
          return (Math.sin(correctedAngle * (Math.PI / 180)) * measuredS) / 10; // cm
        }
      }

      return 0;
    };

    const checkAngles = (measurements) => {
      const filteredMeasurements = Object.keys(measurements)
        .filter((key) => (side === 'Left' ? key > 290 : key < 70))
        .reduce((acc, key) => {
          acc[key] = measurements[key];
          return acc;
        }, {});

      const numMeasurements = Object.keys(filteredMeasurements).length;

      if (side === 'Left') {
        for (let angle = 290; angle < 290 + numMeasurements; angle += 1) {
          const gapSize = getGapSize(filteredMeasurements, angle, angle - 270);

          if (gapSize) {
            logger.log(`obstacle at ${angle}° with a size of ${gapSize.toFixed(2)}cm`, 'superSlalom');
            return Promise.resolve(gapSize);
          }
        }
      } else {
        for (let angle = 70; angle >= 0; angle -= 1) {
          const gapSize = getGapSize(filteredMeasurements, angle, 90 - angle);

          if (gapSize) {
            logger.log(`obstacle at ${angle}° with a size of ${gapSize.toFixed(2)}cm`, 'superSlalom');
            return Promise.resolve(gapSize);
          }
        }
      }

      return Promise.resolve(0);
    };

    const gapSize = await checkAngles(lidarData);

    return Promise.resolve(gapSize >= robot.diameter);
  }

  async function moveThroughGap(side, targetGapWidth) {
    const inAngle = side === 'Left' ? -90 : 90;
    const outAngle = side === 'Left' ? 90 : -90;
    const obstacleAngle = side === 'Left' ? 270 : 90;
    const obstacleDistance = getAngleDistance(lidarData, obstacleAngle) / 10;
    const crossingDistance = Math.round((obstacleDistance * 2) + (obstacles.can.diameter / 2));
    const gapCenter = Math.ceil(Math.round(obstacles.can.diameter / 2) + (targetGapWidth / 2));

    await main.moveForward(speed.straight.slow, gapCenter);
    await main.stop(1);
    await rotate(main, inAngle);
    await main.stop(1);
    await main.moveForward(speed.straight.slow, crossingDistance);
    await main.stop();
    await rotate(main, outAngle);
    await main.stop(1);

    return Promise.resolve();
  }

  async function crossover() {
    const distanceRight = getAngleDistance(lidarData, 90) / 10;
    const distanceLeft = getAngleDistance(lidarData, 270) / 10;
    const distanceFromCenter = (distanceLeft - distanceRight) / 2;
    const crossingDistance = Math.ceil(startOffset + distanceFromCenter);

    await rotate(main, -90);
    await main.stop(1);
    await main.moveForward(speed.straight.slow, crossingDistance);
    await main.stop();
    await rotate(main, -90);
    await main.stop(1);

    return Promise.resolve();
  }

  function onLidarData({ angle, distance }) {
    if (distance) {
      lidarData[Math.floor(angle)] = distance;
    }
  }

  function stop() {
    logger.log('stop', 'superSlalom');
    lidar.off('data', onLidarData);
    main.stop(1);
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
