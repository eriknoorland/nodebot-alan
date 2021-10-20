const robotlib = require('robotlib');
const averageMeasurements = require('../sensor/lidar/averageMeasurements');
const getAngleDistance = require('../sensor/lidar/getAngleDistance');
const getLongestDistance = require('../sensor/lidar/getLongestDistance');
const scanObject2Array = require('../sensor/lidar/scanObject2Array');
const scan = require('../sensor/lidar/scan');
const verifyRotation = require('../../helpers/verifyRotation');

const { pause } = robotlib.utils;
const { deg2rad, rad2deg } = robotlib.utils.math;

const solveStartVector = async (lidar, motion) => {
  const initialMeasurements = await scan(lidar, 1000);
  const averagedMeasurements = averageMeasurements(initialMeasurements);
  const longestDistanceMeasurement = getLongestDistance(scanObject2Array(averagedMeasurements));

  let approachAngle = longestDistanceMeasurement.angle;

  if (approachAngle > 180) {
    approachAngle = (180 - (approachAngle - 180)) * -1;
  }

  await motion.rotate(deg2rad(approachAngle));
  await pause(250);

  motion.appendPose({ x: 0, y: 0, phi: 0 });

  const verificationDistance = 100;
  const rearDistanceMeasurements = await scan(lidar, 1000);
  const rearDistanceAveragedMeasurements = averageMeasurements(rearDistanceMeasurements);
  const rearDistance = getAngleDistance(rearDistanceAveragedMeasurements, 180);
  const reverseDistance = Math.min(rearDistance - 250, verificationDistance);

  if (reverseDistance > 0) {
    await motion.distanceHeading(-reverseDistance, 0);
    await pause(250);
  }

  const startVerificationMeasurements = await scan(lidar, 1000);
  const startVerificationAveragedMeasurements = averageMeasurements(startVerificationMeasurements);
  const leftDistance = getAngleDistance(startVerificationAveragedMeasurements, 270);
  const rightDistance = getAngleDistance(startVerificationAveragedMeasurements, 90);
  const side = {
    angle: leftDistance < rightDistance ? 270 : 90,
    multiplier: leftDistance < rightDistance ? -1 : 1,
  };

  const sideDistanceStart = getAngleDistance(startVerificationAveragedMeasurements, side.angle);

  await motion.distanceHeading(verificationDistance, 0);
  await pause(250);

  const endVerificationMeasurements = await scan(lidar, 1000);
  const endVerificationAveragedMeasurements = averageMeasurements(endVerificationMeasurements);
  const sideDistanceEnd = getAngleDistance(endVerificationAveragedMeasurements, side.angle);
  const sideDifference = (sideDistanceEnd - sideDistanceStart);
  const correctionAngle = Math.sin(sideDifference / verificationDistance);

  await motion.rotate(correctionAngle * side.multiplier);
  await pause(250);

  await verifyRotation(lidar, motion, side.angle, 60);
  await pause(250);

  motion.appendPose({ x: 0, y: 0, phi: 0 });

  return Promise.resolve();
};

module.exports = solveStartVector;
