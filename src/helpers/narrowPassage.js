const narrowPassage = (logger, utils, helpers, lidar, motion) => {
  const { pause } = utils.robotlib;
  const { deg2rad, calculateDistance } = utils.robotlib.math;
  const { getAngleDistance } = utils.sensor.lidar;
  const { isWithinDistance } = helpers;

  function findGap(motion, lidarData) {
    let hasCounterStarted = false;
    let startPose;

    return new Promise(resolve => {
      motion.speedHeading(100, Math.PI);

      const interval = setInterval(() => {
        const minDistance = getAngleDistance(lidarData, 90, 1);
        const maxDistance = getAngleDistance(lidarData, 90, 1, 'max');

        if (!hasCounterStarted && maxDistance > 1000) {
          hasCounterStarted = true;
          startPose = motion.getPose();
        }

        if (hasCounterStarted) {
          const currentPose = motion.getPose();
          const distanceTravelled = calculateDistance(startPose, currentPose);

          if (distanceTravelled >= 118) {
            clearInterval(interval);
            resolve();
            return;
          }

          if (minDistance < 1000 && distanceTravelled > 80) {
            hasCounterStarted = false;
          }
        }
      }, 10);
    });
  }

  function findFrontCanAngle(lidarData, referenceAngle) {
    const reversedLidarData = [...Object.keys(lidarData)].reverse();
    const frontCanAngle = reversedLidarData.map(angle => parseInt(angle, 10))
      .filter(angle => angle < referenceAngle && angle > referenceAngle - 60)
      .find(angle => lidarData[angle] < 1000);

    return frontCanAngle;
  }

  return async () => {
    let lidarData = {};

    const onLidarData = ({ angle, distance }) => {
      if (distance) {
        lidarData[Math.round(angle)] = distance;
      } else {
        delete lidarData[Math.round(angle)];
      }
    };

    lidar.on('data', onLidarData);

    await motion.distanceHeading(800, Math.PI);
    await pause(250);

    await findGap(motion, lidarData);
    await motion.stop();
    await pause(250);

    const frontCanAngle = findFrontCanAngle(lidarData, 90);
    const angleDiff = frontCanAngle - 90;
    const angleDiffRad = deg2rad(angleDiff);
    const remainingDistance = Math.abs(Math.sin(angleDiffRad) * lidarData[frontCanAngle]);
    const centerOffsetDistance = -(Math.abs(((240 / 2) - remainingDistance)) * 1.05);

    lidar.off('data', onLidarData);

    await motion.distanceHeading(centerOffsetDistance, -Math.PI);
    await pause(250);

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
};

module.exports = narrowPassage;