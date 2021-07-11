const config = require('../config');
const rotate = require('../utils/motion/rotate');
const solveStartVector = require('../utils/solveStartVector');
const gotoStartPosition = require('../utils/motion/gotoStartPosition');
const isAtNumTicks = require('../utils/motion/isAtNumTicks');
const driveStraightUntil = require('../utils/motion/driveStraightUntil');
const isWithinDistance = require('../utils/sensor/lidar/isWithinDistance');

module.exports = ({ logger, controllers, sensors }) => {
  const { obstacles, speed } = config;
  const { main } = controllers;
  const { lidar } = sensors;

  let encoderCountTemp;

  function constructor() {
    logger.log('constructor', 'tTime');
  }

  async function start() {
    logger.log('start', 'tTime');

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
    await countTicks();
    await driveStraightUntil(speed.straight.fast, main, driveUntillWallFast);
    await driveStraightUntil(speed.straight.slow, main, driveUntillWallSlow);
    await main.stop();
    numTicks = await getCountedTicks();
    await rotate(main, -180);
    await main.stop(1);
    await driveUntillNumTicks(numTicks, 1);
    await main.stop();
    await rotate(main, 90);
    await main.stop(1);
    await driveStraightUntil(speed.straight.fast, main, driveUntillWallFast);
    await driveStraightUntil(speed.straight.slow, main, driveUntillWallSlow);
    await main.stop();
    await main.disableTicks();

    missionComplete();
  }

  function stop() {
    logger.log('stop', 'tTime');
    main.stop(1);
    encoderCountTemp = 0;
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
    logger.log('mission complete', 'tTime');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
