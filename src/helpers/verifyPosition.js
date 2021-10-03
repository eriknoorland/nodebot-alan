const robotlib = require('robotlib');
const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const getAngleDistance = require('../utils/sensor/lidar/getAngleDistance');

const { deg2rad } = robotlib.utils.math;

const verifyPosition = async (lidar, motion) => {
  const scanData = await scan(lidar, 2000);
  const averagedMeasurements = averageMeasurements(scanData);
  const shortestRightDistance = getAngleDistance(averagedMeasurements, 90, 10);
  const correctionAngle = shortestRightDistance.angle - 90;
  const x = averagedMeasurements[180 + correctionAngle];
  const y = shortestRightDistance.distance;

  console.log({ shortestRightDistance, correctionAngle, x, y });

  // await motion.rotate(deg2rad(correctionAngle));

  return Promise.resolve({ x, y });
};

module.exports = verifyPosition;