const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const filterMeasurements = require('../utils/sensor/lidar/filterMeasurements');
const obstacleDetection = require('../utils/sensor/lidar/obstacleDetection');

const localiseCans = async (scanRadius, matrix, pose, lidar, resolution) => {
  const scanData = await scan(lidar, 2000);
  const averagedMeasurements = averageMeasurements(scanData);
  const angleFilteredMeasurements = filterMeasurements(averagedMeasurements, a => a >= 270 || a <= 90);
  const distanceFilteredMeasurements = filterMeasurements(angleFilteredMeasurements, a => angleFilteredMeasurements[a] < scanRadius);

  return obstacleDetection(matrix, pose, distanceFilteredMeasurements, resolution);
};

module.exports = localiseCans;