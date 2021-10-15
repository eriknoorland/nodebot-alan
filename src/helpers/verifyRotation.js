const robotlib = require('robotlib');
const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const filterMeasurements = require('../utils/sensor/lidar/filterMeasurements');

const { rad2deg, deg2rad } = robotlib.utils.math;

const verifyRotation = async (lidar, motion, angle, openingAngle) => {
  const minAngle = angle - (openingAngle / 2);
  const maxAngle = angle + (openingAngle / 2);
  const measurements = await scan(lidar, 2000);
  const averagedMeasurements = averageMeasurements(measurements);
  const filteredMeasurements = filterMeasurements(averagedMeasurements, a => a >= minAngle && a <= maxAngle);
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

  // const measurements = await scan(lidar, 2000);
  // const averagedMeasurements = averageMeasurements(measurements);
  // const angleOffset = openingAngle / 2;
  // const centerAngleDistance = averagedMeasurements[angle];
  // const minAngleDistance = averagedMeasurements[minAngle];
  // const maxAngleDistance = averagedMeasurements[maxAngle];

  // const a = centerAngleDistance;
  // const o = Math.tan(deg2rad(angleOffset)) * a;
  // const s = Math.sqrt(Math.pow(a, 2) + Math.pow(o, 2));
  // const A = maxAngleDistance - s;
  // const b = Math.tan(A / o) * -1;

  // console.log(
  //   { minAngleDistance, maxAngleDistance, a, o, s, A, b },
  //   rad2deg(b),
  // );

  // await motion.rotate(b);

  const testMeasurements = await scan(lidar, 2000);
  const testAveragedMeasurements = averageMeasurements(testMeasurements);

  console.log(
    testAveragedMeasurements[minAngle],
    testAveragedMeasurements[angle],
    testAveragedMeasurements[maxAngle],
  );
};

module.exports = verifyRotation;