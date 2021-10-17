const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');

const verifyPosition = async (arena, lidar, motion, heading) => {
  const measurements = await scan(lidar, 1000);
  const averagedMeasurements = averageMeasurements(measurements);

  motion.appendPose({
    x: averagedMeasurements[180] || averagedMeasurements[179] || averagedMeasurements[181],
    y: arena.height - averagedMeasurements[90],
    phi: heading,
  });

  return Promise.resolve();
};

module.exports = verifyPosition;