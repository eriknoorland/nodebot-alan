const robotlib = require('robotlib');
const averageMeasurements = require('../sensor/lidar/averageMeasurements');
const getAngleDistance = require('../sensor/lidar/getAngleDistance');
const getLongestDistance = require('../sensor/lidar/getLongestDistance');
const getShortestDistance = require('../sensor/lidar/getShortestDistance');
const normalizeAngle = require('../sensor/lidar/normalizeAngle');
const scanObject2Array = require('../sensor/lidar/scanObject2Array');
const scan = require('../sensor/lidar/scan');

/**
 * Resolve the angle from the given measurements
 * @param {Object} measurements
 * @return {Promise}
 */
const decideAngle = measurements => {
  const minValue = getShortestDistance(scanObject2Array(measurements));
  const directions = [minValue];

  console.log('decideAngle - minValue', minValue);

  for (let i = 1; i <= 3; i += 1) {
    const angle = normalizeAngle(minValue.angle + (i * 90));
    const distance = measurements[angle];

    directions.push({ angle, distance });
  }

  const direction = getLongestDistance(directions);
  let { angle } = direction;

  console.log('decideAngle - direction', direction);

  if (angle > 180) {
    angle = (180 - (angle - 180)) * -1;
  }

  return angle;
};

/**
 * Returns a promise when the start vector is verified
 * @param {Object} lidar
 * @param {Object} motion
 * @return {Promise}
 */
const verifyStartVector = async (lidar, motion) => {
  const scanDuration = 2000; // ms
  const forwardDistance = 200; // mm

  let measurements = {};
  let averagedMeasurements = {};

  measurements = await scan(lidar, scanDuration);
  averagedMeasurements = await averageMeasurements(measurements);

  const rearOffset = (20 / 2) + 4; // (robot diamater / 2) + margin
  const rearDistance = getAngleDistance(averagedMeasurements, 180) / 10;
  const reverseDistance = Math.floor(rearDistance - rearOffset);

  if (reverseDistance > 0) {
    await motion.distanceHeading(-reverseDistance, 0); // FIXME reverse
  }

  measurements = await scan(lidar, scanDuration);
  averagedMeasurements = await averageMeasurements(measurements);

  const rightSideDistanceStart = getAngleDistance(averagedMeasurements, 90);

  await motion.distanceHeading(forwardDistance, 0);

  measurements = await scan(lidar, scanDuration);
  averagedMeasurements = await averageMeasurements(measurements);

  const rightSideDistanceEnd = getAngleDistance(averagedMeasurements, 90);
  const rightSideDifference = (rightSideDistanceEnd - rightSideDistanceStart) / 10;
  const correctionAngle = Math.sin(rightSideDifference / forwardDistance);

  if (correctionAngle) {
    await motion.rotate(correctionAngle);
  }

  return Promise.resolve();
};

/**
 * Solve start vector
 * @param {Object} lidar
 * @param {Object} motion
 * @return {Promise}
 */
const solveStartVector = async (lidar, motion) => {
  // const rotationOffset = 20; // deg
  // const rotationOffsetRad = robotlib.utils.math.deg2rad(rotationOffset); // rad
  const scanDuration = 2000; // ms

  let measurements = {};

  // await main.setLedColor.apply(null, config.color.orange);

  await scan(lidar, scanDuration, 0, measurements);
  // await motion.rotate(rotationOffsetRad);

  // await scan(lidar, scanDuration, rotationOffset, measurements);
  // await motion.rotate(-(rotationOffsetRad * 2));

  // await scan(lidar, scanDuration, -rotationOffset, measurements);
  // await motion.rotate(rotationOffsetRad);

  const averagedMeasurements = await averageMeasurements(measurements);
  const estimatedCorrectionAngle = decideAngle(averagedMeasurements);
  const estimatedCorrectionAngleRad = robotlib.utils.math.deg2rad(estimatedCorrectionAngle);

  console.log({ estimatedCorrectionAngle, estimatedCorrectionAngleRad });

  await motion.rotate(estimatedCorrectionAngleRad);
  await verifyStartVector(lidar, motion);

  // FIXME scan left and rear to determine x and y
  // await motion.setTrackPose(true);
  // await motion.appendPose({ x, y, phi: 0});

  // await main.setLedColor.apply(null, config.color.green);

  return Promise.resolve();
};

module.exports = solveStartVector;
