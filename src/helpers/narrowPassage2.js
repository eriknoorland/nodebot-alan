const robotlib = require('robotlib');
const getAngleDistance = require('../utils/sensor/lidar/getAngleDistance');
const isWithinDistance = require('../utils/sensor/lidar/isWithinDistance');

const { pause } = robotlib.utils;
const { calculateDistance } = robotlib.utils.math;

function isAtAreaC(lidar, minDistance, checkAngle) {
  let atAreaC = false;
  let count = 0;

  const onLidarData = ({ quality, angle, distance }) => {
    if (quality > 10 && Math.floor(angle) === checkAngle) {
      if (distance > 0 && distance >= minDistance) {
        count += 1;

        if (count % 2 === 0) {
          atAreaC = true;
          lidar.off('data', onLidarData);
        }
      }
    }
  };

  lidar.on('data', onLidarData);

  return () => atAreaC;
}

function findGap(motion, lidarData) {
  // let isAtFirstCan = false;
  let hasCounterStarted = false;
  let startPose;

  return new Promise(resolve => {
    motion.speedHeading(100, Math.PI);

    const interval = setInterval(() => {
      const minDistance = getAngleDistance(lidarData, 90, 1);
      const maxDistance = getAngleDistance(lidarData, 90, 1, 'max');

      // if (!isAtFirstCan && minDistance < 1000) {
      //   console.log('findGap - is at first can');
      //   isAtFirstCan = true;
      // }

      // if (isAtFirstCan) {
        if (!hasCounterStarted && maxDistance > 1000) {
          console.log('findGap - gap counter started');
          hasCounterStarted = true;
          startPose = motion.getPose();
        }

        if (hasCounterStarted) {
          const currentPose = motion.getPose();
          const distanceTravelled = calculateDistance(startPose, currentPose);
          // console.log({ distanceTravelled });

          if (distanceTravelled >= 120) {
            console.log('findGap - gap found');
            clearInterval(interval);
            resolve();
            return;
          }

          if (minDistance < 1000 && distanceTravelled > 80) {
            console.log('findGap - gap counter reset');
            hasCounterStarted = false;
          }
        }
      // }
    }, 20);
  });
}

const narrowPassage = async (config, lidar, motion) => {
  let lidarData = {};

  const onLidarData = ({ angle, distance }) => {
    if (distance) {
      lidarData[Math.round(angle)] = distance;
    }
  };

  lidar.on('data', onLidarData);

  await motion.distanceHeading(800, Math.PI);
  await pause(250);

  await findGap(motion, lidarData);

  lidar.off('data', onLidarData);

  await motion.stop();

  await motion.rotate(Math.PI / 2);
  await pause(250);
  await motion.speedHeading(200, -Math.PI / 2, isWithinDistance(lidar, 400, 0));
  await motion.stop();
  await pause(250);
  await motion.speedHeading(-200, -Math.PI / 2, isWithinDistance(lidar, 750, 180));
  await motion.stop();
  await pause(250);
  await motion.rotate(-Math.PI / 2);
  await pause(250);

  return Promise.resolve();
};

module.exports = narrowPassage;