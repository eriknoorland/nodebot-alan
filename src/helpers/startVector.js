module.exports = (logger, utils, helpers, motion) => async () => {
  const { averageMeasurements, getAngleDistance, getLongestDistance, scanObject2Array } = utils.sensor.lidar;
  const { scan, verifyRotation } = helpers;
  const { pause } = utils.robotlib;
  const { deg2rad } = utils.robotlib.math;

  const measurements = averageMeasurements(await scan(1000));
  const longestDistanceMeasurement = getLongestDistance(scanObject2Array(measurements));

  let approachAngle = longestDistanceMeasurement.angle;

  if (approachAngle > 180) {
    approachAngle = (180 - (approachAngle - 180)) * -1;
  }

  await motion.rotate(deg2rad(approachAngle));
  await pause(250);

  motion.appendPose({ x: 0, y: 0, phi: 0 });

  const verificationDistance = 100;
  const rearDistanceMeasurements = averageMeasurements(await scan(1000));
  const rearDistance = getAngleDistance(rearDistanceMeasurements, 180);
  const reverseDistance = Math.min(rearDistance - 250, verificationDistance);

  if (reverseDistance > 0) {
    await motion.distanceHeading(-reverseDistance, 0);
    await pause(250);
  }

  const startVerificationMeasurements = averageMeasurements(await scan(1000));
  const leftDistance = getAngleDistance(startVerificationMeasurements, 270);
  const rightDistance = getAngleDistance(startVerificationMeasurements, 90);
  const side = {
    angle: leftDistance < rightDistance ? 270 : 90,
    multiplier: leftDistance < rightDistance ? -1 : 1,
  };

  const sideDistanceStart = getAngleDistance(startVerificationMeasurements, side.angle);

  await motion.distanceHeading(verificationDistance, 0);
  await pause(250);

  const endVerificationMeasurements = averageMeasurements(await scan(1000));
  const sideDistanceEnd = getAngleDistance(endVerificationMeasurements, side.angle);
  const sideDifference = (sideDistanceEnd - sideDistanceStart);
  const correctionAngle = Math.sin(sideDifference / verificationDistance);

  await motion.rotate(correctionAngle * side.multiplier);
  await pause(250);

  await verifyRotation(side.angle, 60);
  await pause(250);

  motion.appendPose({ x: 0, y: 0, phi: 0 });

  return Promise.resolve();
};
