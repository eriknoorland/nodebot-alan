/**
 * Returns an object with the angle and distance for the longest measured distance
 * @param {Array} measurements
 * @return {Object}
 */
 const getLongestDistance = measurements => measurements
  .reduce((max, m) => (m.distance > max.distance ? m : max), measurements[0]);

export default getLongestDistance;
