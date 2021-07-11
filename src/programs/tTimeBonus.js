const config = require('../config');
const deg2rad = require('../utils/math/deg2rad');
const rad2deg = require('../utils/math/rad2deg');
const rotate = require('../utils/motion/rotate');
const solveStartVector = require('../utils/solveStartVector');
const gotoStartPosition = require('../utils/motion/gotoStartPosition');
const getAngleDistance = require('../utils/sensor/lidar/getAngleDistance');
const getShortestDistance = require('../utils/sensor/lidar/getShortestDistance');
const driveStraightUntil = require('../utils/motion/driveStraightUntil');
const isAtNumTicks = require('../utils/motion/isAtNumTicks');
const isWithinDistance = require('../utils/sensor/lidar/isWithinDistance');

module.exports = ({ logger, controllers, sensors }) => {
  const { speed, obstacles } = config;
  const { main } = controllers;
  const { lidar } = sensors;
  const lidarData = {};

  let encoderCountTemp;

  function constructor() {
    logger.log('constructor', 'tTimeBonus');
    lidar.on('data', onLidarData);
  }

  async function start() {
    const driveToEndCondition = isWithinDistance.bind(null, lidar, obstacles.wall.close, 0);
    const gap = { minAngle: 0, maxAngle: 0 };
    const scanRange = 50;

    const driveUntillWallFast = isWithinDistance.bind(null, lidar, obstacles.wall.far, 0);
    const driveUntillWallSlow = isWithinDistance.bind(null, lidar, obstacles.wall.close, 0);
    let numTicks = 0;

    await solveStartVector(lidar, main);
    await gotoStartPosition(lidar, main);
    await main.enableTicks();
    await countTicks();
    await driveStraightUntil(speed.straight.fast, main, driveUntillWallFast);
    await driveStraightUntil(speed.straight.slow, main, driveUntillWallSlow);
    await main.stop();
    numTicks = await getCountedTicks();
    await rotate(main, -180);
    await main.stop(1);
    await driveUntillNumTicks(numTicks, 0.5);
    await main.stop();
    await rotate(main, 90);
    await main.stop(1);

    await main.moveForward(speed.straight.medium, 60);

    const getScanRange = (angle) => angle >= (360 - scanRange) || angle <= scanRange;

    const scanData2Array = (acc, a) => {
      const angle = a > 180 ? (360 - a) * -1 : parseInt(a, 10);
      const distance = lidarData[a];

      acc.push({ angle, distance });
      return acc;
    };

    const measurements = Object.keys(lidarData)
      .filter(getScanRange)
      .reduce(scanData2Array, [])
      .sort((a, b) => a.angle - b.angle);

    const shortestDistance = getShortestDistance(measurements);
    const distanceToObstacleLine = shortestDistance.distance * Math.cos(deg2rad(shortestDistance.angle));
    const obstacleMeasurements = measurements.filter(({ angle, distance }) => {
      const a = angle < 0 ? (360 + angle) : angle;
      const referenceS = distanceToObstacleLine / Math.cos(deg2rad(a));

      return distance < referenceS + 50;
    });

    for (let i = 1, x = obstacleMeasurements.length; i < x; i += 1) {
      const minAngle = obstacleMeasurements[i - 1].angle;
      const maxAngle = obstacleMeasurements[i].angle;
      const angleDiff = maxAngle - minAngle;

      if (angleDiff > gap.maxAngle - gap.minAngle) {
        gap.maxAngle = maxAngle;
        gap.minAngle = minAngle;
      }
    }

    const gapAngle = Math.round((gap.minAngle + gap.maxAngle) / 2);
    const normalizedGapAngle = (360 + gapAngle) % 360;
    const sideDistanceOffset = Math.floor(gapAngle / 15) * 10;
    const sideDistance = (distanceToObstacleLine * Math.tan(deg2rad(normalizedGapAngle))) + sideDistanceOffset;
    const forwardDistance = distanceToObstacleLine - 250;
    const turnAngle = Math.ceil(rad2deg(Math.atan(sideDistance / forwardDistance)));
    const driveDistance = Math.ceil((Math.sqrt(Math.pow(forwardDistance, 2) + Math.pow(sideDistance, 2))) / 10);

    await rotate(main, turnAngle);
    await main.moveForward(speed.straight.slow, driveDistance);
    await main.stop(1);
    await rotate(main, turnAngle * -1);
    await driveStraightUntil(speed.straight.medium, main, driveToEndCondition);
    await main.stop();

    await rotate(main, 180);
    await driveStraightUntil(speed.straight.fast, main, driveUntillWallFast);
    // await driveStraightUntil(speed.straight.slow, main, driveUntillWallSlow);
    await main.stop();
    await rotate(main, 90);
    await main.stop(1);
    await driveStraightUntil(speed.straight.fast, main, driveUntillWallFast);
    await driveStraightUntil(speed.straight.slow, main, driveUntillWallSlow);
    await main.stop();
    await main.disableTicks();

    missionComplete();
  }

  function onLidarData({ angle, distance }) {
    if (distance) {
      lidarData[Math.floor(angle)] = distance;
    }
  }

  function stop() {
    logger.log('stop', 'tTimeBonus');
    lidar.off('data', onLidarData);
    main.stop(1);
  }

  function driveUntillNumTicks(numTicks, multiplier) {
    const target = numTicks * multiplier;

    return driveStraightUntil(speed.straight.fast, main, isAtNumTicks.bind(null, main, target));
  }

  function countTicks() {
    encoderCountTemp = 0;
    main.on('ticks', onTicksData);

    return Promise.resolve();
  }

  function getCountedTicks() {
    main.off('ticks', onTicksData);

    return Promise.resolve(encoderCountTemp);
  }

  function onTicksData({ right }) {
    encoderCountTemp += right;
  }

  function missionComplete() {
    logger.log('mission complete', 'tTimeBonus');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
