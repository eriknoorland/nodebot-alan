const verifyRotation = (logger, utils, helpers, motion) => async (angle, openingAngle) => {
  const { deg2rad } = utils.robotlib.math;
  const { averageMeasurements, filterMeasurements } = utils.sensor.lidar;
  const { scan } = helpers;

  const minAngle = angle - (openingAngle / 2);
  const maxAngle = angle + (openingAngle / 2);
  const measurements = averageMeasurements(await scan(1000));
  const filteredMeasurements = filterMeasurements(measurements, a => a >= minAngle && a <= maxAngle);
  const points = [];

  Object
    .keys(filteredMeasurements)
    .forEach(angle => {
      const distance = filteredMeasurements[angle];
      const angleRad = deg2rad(parseInt(angle, 10));
      const x = Math.cos(angleRad) * distance;
      const y = Math.sin(angleRad) * distance;

      points.push({ x, y });
    });

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const s = firstPoint.x - lastPoint.x;
  const o = firstPoint.y - lastPoint.y;
  const sin = Math.sin(o / s);

  await motion.rotate(sin);
};

module.exports = verifyRotation;