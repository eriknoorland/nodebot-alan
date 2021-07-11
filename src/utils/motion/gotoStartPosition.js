const averageMeasurements = require('../sensor/lidar/averageMeasurements');
const getAngleDistance = require('../sensor/lidar/getAngleDistance');
const scan = require('../sensor/lidar/scan');

/**
 *
 * @param {Object} motion
 * @param {Number} centerOffset [-x / x]
 * @return {Promise}
 */
const gotoStartPosition = async (lidar, motion, centerOffset = 0) => {
  const measurements = await scan(lidar, 2000, 0, {});
  const averagedMeasurements = await averageMeasurements(measurements);
  // const rearDistance = getAngleDistance(averagedMeasurements, 180) / 10;
  // const reverseDistance = rearDistance > 10 ? 10 : 0;

  // if (reverseDistance > 0) {
  //   await motion.moveBackward(speed.straight.precision, reverseDistance);
  //   await motion.stop(1);
  // }

  const offsetLeft = Math.round(getAngleDistance(averagedMeasurements, 270) / 10);
  const offsetRight = Math.round(getAngleDistance(averagedMeasurements, 90) / 10);
  const currentOffset = Math.round((offsetLeft - offsetRight) / 2);
  const distance = Math.max(centerOffset, currentOffset) - Math.min(centerOffset, currentOffset);
  const angle = (centerOffset - currentOffset) < 0 ? -(Math.PI / 2) : Math.PI / 2;

  if (!distance) {
    return Promise.resolve();
  }

  await motion.rotate(angle);
  await motion.distanceHeading(distance, angle);
  await motion.rotate(angle * -1);


  return Promise.resolve();
};

module.exports = gotoStartPosition;
