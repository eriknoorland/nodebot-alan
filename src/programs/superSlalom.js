const EventEmitter = require('events');

module.exports = () => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const { getAngleDistance } = utils.sensor.lidar;
  const { rad2deg, deg2rad, calculateDistance } = utils.robotlib.math;
  const { startPosition, isWithinDistance, verifyRotation } = helpers;
  const { motion } = actuators;
  const { lidar } = sensors;
  const { pause } = utils.robotlib;
  const startOffset = 250;
  const lidarData = {};

  let heading = 0;
  let side = 'left';

  function constructor() {
    lidar.on('data', onLidarData);
  }

  async function start() {
    await startPosition(arena.height, startOffset);

    await findGap();
    await motion.stop();
    await moveThroughGap();

    side = 'right';
    await findGap();
    await motion.stop();
    await moveThroughGap();
    side = 'left';

    await motion.speedHeading(config.MAX_SPEED, heading, isWithinDistance(config.WALL_STOPPING_DISTANCE));
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

    await motion.speedHeading(config.MAX_SPEED, heading, isWithinDistance(config.WALL_STOPPING_DISTANCE));
    await motion.stop();

    eventEmitter.emit('mission_complete');
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
        }

        if (isAtFirstCan) {
          if (!hasCounterStarted && maxDistance > 600) {
            hasCounterStarted = true;
            startPose = motion.getPose();
          }

          if (hasCounterStarted) {
            const currentPose = motion.getPose();
            const distanceTravelled = calculateDistance(startPose, currentPose);

            if (distanceTravelled >= 95) {
              clearInterval(interval);
              resolve();
              return;
            }

            if (minDistance < 600) {
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

    await verifyRotation(90, 60);
    await pause(250);

    return Promise.resolve();
  }

  function stop() {
    motion.stop(true);
    motion.setTrackPose(false);

    lidar.off('data', onLidarData);
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
    events: eventEmitter,
    start,
    stop,
  };
};
