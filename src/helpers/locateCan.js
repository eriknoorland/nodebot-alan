const pickupCan = (logger, utils, helpers) => async (config) => {
  const { averageMeasurements, filterMeasurements } = utils.sensor.lidar;
  const { scan } = helpers;
  const canAngleAveragedMeasurements = averageMeasurements(await scan(1000));
  const canAngleFilteredAngleMeasurements = filterMeasurements(canAngleAveragedMeasurements, a => a > 330 || a < 30);
  const canAngleFilteredDistanceMeasurements = filterMeasurements(canAngleFilteredAngleMeasurements, a => canAngleFilteredAngleMeasurements[a] < (config.GRIPPER_OBSTACLE_DISTANCE + 25));
  const normalizedAngles = Object
    .keys(canAngleFilteredDistanceMeasurements)
    .map(a => ({
      angle: parseInt(a > 180 ? (360 - a) * -1 : a, 10),
      distance: canAngleFilteredDistanceMeasurements[a],
    }));

  const sortedAngles = normalizedAngles.slice(0).sort((a, b) => a.angle - b.angle);
  const canCenter = sortedAngles[Math.floor(sortedAngles.length / 2)];

  if (!canCenter) {
    return Promise.reject('This is not the can you are looking for');
  }

  return Promise.resolve(canCenter);
};

module.exports = pickupCan;
