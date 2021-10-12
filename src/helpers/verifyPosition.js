const robotlib = require('robotlib');
const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const filterMeasurements = require('../utils/sensor/lidar/filterMeasurements');
const scanObject2Array = require('../utils/sensor/lidar/scanObject2Array');
const getShortestDistance = require('../utils/sensor/lidar/getShortestDistance');

const { deg2rad } = robotlib.utils.math;

const verifyPosition = async (arena, lidar, motion) => {
  const scanData = await scan(lidar, 2000);
  const averagedMeasurements = averageMeasurements(scanData);
  const filteredMeasurements = filterMeasurements(averagedMeasurements, a => a > 60 && a < 120);
  const { angle, distance } = getShortestDistance(scanObject2Array(filteredMeasurements));
  const correctionAngle = angle - 90;
  const x = averagedMeasurements[180 + correctionAngle];
  const y = arena.height - distance;

  console.log({ angle, correctionAngle, distance, x, y });

  // await motion.rotate(deg2rad(correctionAngle));

  return Promise.resolve({ x, y });
};

module.exports = verifyPosition;