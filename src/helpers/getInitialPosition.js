/**
 * Returns the x and y position based on lidar measurements and the current arena "height"
 * @param {Object} measurements
 * @param {Number} arenaHeight
 * @returns {Object} { x, y }
 */
const getInitialPosition = (logger, utils, helpers) => (measurements, arenaHeight) => {
  const { getAngleDistance } = utils.sensor.lidar;
  const x = getAngleDistance(measurements, 180);
  const y = getAngleDistance(measurements, 270) + (arenaHeight / 2);

  return { x, y };
};

module.exports = getInitialPosition;