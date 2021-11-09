const gotoStartPosition = (utils, helpers, motion) => async (measurements, centerOffset = 0) => {
  const { pause } = utils.robotlib;
  const { getAngleDistance } = utils.sensor.lidar;

  const offsetLeft = Math.round(getAngleDistance(measurements, 270));
  const offsetRight = Math.round(getAngleDistance(measurements, 90));
  const currentOffset = Math.round((offsetLeft - offsetRight) / 2);
  const distance = Math.max(centerOffset, currentOffset) - Math.min(centerOffset, currentOffset);
  const direction = centerOffset - currentOffset < 0 ? -1 : 1;
  const angle = (Math.PI / 2) * direction;

  if (!distance) {
    return Promise.resolve();
  }

  await motion.rotate(angle);
  await pause(250);

  await motion.distanceHeading(distance, angle);
  await pause(250);

  await motion.rotate(angle * -1);
  await pause(250);

  return Promise.resolve();
};

module.exports = gotoStartPosition;
