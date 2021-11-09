module.exports = (utils, helpers, motion) => async (arenaHeight, centerOffset = 0) => {
  const { pause } = utils.robotlib;
  const { averageMeasurements } = utils.sensor.lidar;
  const { scan, startVector, gotoStartPosition, getInitialPosition, verifyRotation } = helpers;

  await startVector();

  const startPositionMeasurements = averageMeasurements(await scan(2000));
  await gotoStartPosition(startPositionMeasurements, centerOffset);

  if (centerOffset) {
    await verifyRotation(centerOffset < 0 ? 270 : 90, 60);
    await pause(250);
  }

  const averagedMeasurements = averageMeasurements(await scan(2000));
  const initialPosition = getInitialPosition(averagedMeasurements, arenaHeight);

  motion.setTrackPose(true);
  motion.appendPose({ ...initialPosition, phi: 0 });

  return Promise.resolve(initialPosition);
}