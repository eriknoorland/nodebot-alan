const robotlib = require('robotlib');
const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const solveStartVector = require('../utils/motion/solveStartVector2');
const gotoStartPosition = require('../utils/motion/gotoStartPosition');
const getInitialPosition = require('../utils/motion/getInitialPosition');
const isWithinDistance = require('../utils/sensor/lidar/isWithinDistance');

const { calculateDistance, deg2rad } = robotlib.utils.math;
const { getShortestDistance } = robotlib.utils.sensor.lidar;

module.exports = (narrowPassage = false) => ({ config, arena, logger, controllers, sensors }) => {
  const { motion } = controllers;
  const { lidar } = sensors;
  const lidarData = {};

  function constructor() {
    logger.log('constructor', 'tTime');
  }

  async function start() {
    logger.log('start', 'tTime');
    lidar.on('data', onLidarData);

    await solveStartVector(lidar, motion);

    const startPositionScanData = await scan(lidar, 2000);
    const startPositionAveragedMeasurements = averageMeasurements(startPositionScanData);
    await gotoStartPosition(startPositionAveragedMeasurements, motion);

    const initialPositionScanData = await scan(lidar, 2000);
    const averagedMeasurements = averageMeasurements(initialPositionScanData);
    const { x, y } = getInitialPosition(averagedMeasurements, arena.height);

    motion.setTrackPose(true);
    motion.appendPose({ x, y, phi: 0 });

    // A -> B
    const startPose = motion.getPose();
    await motion.speedHeading(config.MAX_SPEED, 0, isWithinDistance(lidar, 400, 0));
    await motion.stop();
    const bPose = motion.getPose();
    const startToBDistance = calculateDistance(startPose, bPose);
    await motion.rotate(-Math.PI);

    // B -> center
    await motion.distanceHeading(startToBDistance * 0.5, -Math.PI);
    await motion.stop();
    await motion.rotate(Math.PI / 2);

    if (narrowPassage) {
      await motion.distanceHeading(arena.height * 0.25, -Math.PI / 2);

      const scanData2Array = (data, acc, a) => {
        const angle = a > 180 ? (360 - a) * -1 : parseInt(a, 10);
        const distance = data[a];

        acc.push({ angle, distance });
        return acc;
      };

      const measurements = Object.keys(lidarData)
        .filter(getScanRange.bind(null, 50))
        .reduce(scanData2Array.bind(null, lidarData), [])
        .sort((a, b) => a.angle - b.angle);

      const shortestDistance = getShortestDistance(measurements);
      const distanceToObstacleLine = shortestDistance.distance * Math.cos(deg2rad(shortestDistance.angle));
      const obstacleMeasurements = measurements.filter(({ angle, distance }) => {
        const a = angle < 0 ? (360 + angle) : angle;
        const referenceS = distanceToObstacleLine / Math.cos(deg2rad(a));

        return distance < referenceS + 50;
      });

      const gap = { minAngle: 0, maxAngle: 0 };

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
      const sideDistanceOffset = Math.floor(gapAngle / 15) * 25;

      const sideDistance = (distanceToObstacleLine * Math.tan(deg2rad(normalizedGapAngle))) + sideDistanceOffset;
      const forwardDistance = distanceToObstacleLine - 150; // was 250
      const turnAngle = Math.atan(sideDistance / forwardDistance);
      const driveDistance = Math.round((Math.sqrt(Math.pow(forwardDistance, 2) + Math.pow(sideDistance, 2))));

      // move to gap
      await motion.rotate(turnAngle);
      await motion.distanceHeading(driveDistance, (-Math.PI / 2) + turnAngle);
      await motion.rotate(turnAngle * -1);

      // go trough gap
      await motion.speedHeading(200 / 2, -Math.PI / 2, isWithinDistance(lidar, 250, 0));
      await motion.stop();

      // back to center
      await motion.speedHeading(-config.MAX_SPEED, Math.PI / 2, isWithinDistance(lidar, 750, 0));
      await motion.stop();
      await motion.rotate(-Math.PI / 2);

      // await motion.rotate(-Math.PI);
      // await motion.speedHeading(config.MAX_SPEED, Math.PI / 2, isWithinDistance(lidar, 600, 0));
      // await motion.stop();
      // await motion.rotate(Math.PI / 2);
    } else {
      // center -> C
      const centerPose = motion.getPose();
      await motion.speedHeading(config.MAX_SPEED, -Math.PI / 2, isWithinDistance(lidar, 400, 0));
      await motion.stop();
      const cPose = motion.getPose();
      const centerToCDistance = calculateDistance(centerPose, cPose);
      // await motion.rotate(-Math.PI);

      // C -> center
      await motion.distanceHeading(-centerToCDistance, Math.PI / 2);
      await motion.stop();
      await motion.rotate(-Math.PI / 2);
    }

    // center -> A
    await motion.speedHeading(config.MAX_SPEED, -Math.PI, isWithinDistance(lidar, 400, 0));
    await motion.stop();

    missionComplete();
  }

  function stop() {
    logger.log('stop', 'tTime');
    motion.stop(true);
    lidar.off('data', onLidarData);
  }

  function missionComplete() {
    logger.log('mission complete', 'tTime');
    stop();
  }

  function onLidarData({ angle, distance }) {
    if (distance) {
      lidarData[Math.floor(angle)] = distance;
    }
  }

  function getScanRange(range, angle) {
    return angle >= (360 - range) || angle <= range;
  }

  constructor();

  return {
    start,
    stop,
  };
};
