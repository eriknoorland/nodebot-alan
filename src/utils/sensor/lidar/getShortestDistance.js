/**
 * Returns an object with the angle and distance for the shortest measured distance
 * @param {Array} measurements
 * @return {Object}
 */
 const getShortestDistance = measurements => measurements
  .reduce((min, m) => (m.distance < min.distance ? m : min), measurements[0]);

module.exports = getShortestDistance;
