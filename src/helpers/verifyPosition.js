const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');

const verifyPosition = async (arena, lidar) => {
  const measurements = await scan(lidar, 2000);
  const averagedMeasurements = averageMeasurements(measurements);

  return Promise.resolve({
    x: averagedMeasurements[180],
    y: arena.height - averagedMeasurements[90],
  });
};

module.exports = verifyPosition;