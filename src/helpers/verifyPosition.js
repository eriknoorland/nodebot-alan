const verifyPosition = (utils, helpers, lidar, motion) => async (arena, heading) => {
  const { averageMeasurements } = utils.sensor.lidar;
  const { scan }  = helpers;
  const averagedMeasurements = averageMeasurements(await scan(lidar, 1000));
  const pose = {
    x: averagedMeasurements[180] || averagedMeasurements[179] || averagedMeasurements[181],
    y: arena.height - averagedMeasurements[90],
    phi: heading,
  };

  motion.appendPose(pose);

  return Promise.resolve();
};

module.exports = verifyPosition;