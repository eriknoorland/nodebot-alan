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
  const verificationDistance = getAngleDistance(measurements, normalizeAngle(minValue.angle + 20), 1);
  let firstDirection = minValue;

  if (verificationDistance > minValue.distance * 2) {
    firstDirection = { angle: minValue.angle, distance: verificationDistance }
  }

  console.log(minValue, verificationDistance);

  const directions = [firstDirection];

  for (let i = 1; i <= 3; i += 1) {
    const angle = normalizeAngle(minValue.angle + (i * 90));
    const distance = measurements[angle];

    directions.push({ angle, distance });
  }

  console.log(directions);

  const direction = getLongestDistance(directions);
  let { angle } = direction;

  if (angle > 180) {
    angle = (180 - (angle - 180)) * -1;
  }

  console.log(angle);

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
  averagedMeasurements = averageMeasurements(measurements);

  const rearOffset = (200 / 2) + 50;
  const rearDistance = getAngleDistance(averagedMeasurements, 180);
  const reverseDistance = Math.floor(rearDistance - rearOffset);

  if (reverseDistance > 0) {
    await motion.distanceHeading(-reverseDistance, 0);
  }

  measurements = await scan(lidar, scanDuration);
  averagedMeasurements = averageMeasurements(measurements);

  const rightSideDistanceStart = getAngleDistance(averagedMeasurements, 90);

  await motion.distanceHeading(forwardDistance, 0);

  measurements = await scan(lidar, scanDuration);
  averagedMeasurements = averageMeasurements(measurements);

  const rightSideDistanceEnd = getAngleDistance(averagedMeasurements, 90);
  const rightSideDifference = (rightSideDistanceEnd - rightSideDistanceStart);
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
  const measurements = {};

  await scan(lidar, 2000, 0, measurements);

  const averagedMeasurements = averageMeasurements(measurements);
  const estimatedCorrectionAngle = decideAngle(averagedMeasurements);

  await motion.rotate(robotlib.utils.math.deg2rad(estimatedCorrectionAngle));
  motion.appendPose({ x: 0, y: 0, phi: 0 });

  await verifyStartVector(lidar, motion);
  motion.appendPose({ x: 0, y: 0, phi: 0 });

  return Promise.resolve();
};

module.exports = solveStartVector;
