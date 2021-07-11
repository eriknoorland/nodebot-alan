/**
 * Returns the smallest or longest distance measured for a given angle with a given opening range
 * @param {Object} data
 * @param {Number} angle
 * @param {Number} range
 * @param {String} which
 * @return {Promise}
 */
 function getAngleDistance(data, angle, range = 5, which = 'min') {
  const distances = Object.keys(data)
    .filter((a) => a >= angle - range && a <= angle + range)
    .map((a) => data[a]);

  return Math[which](...distances);
}

module.exports = getAngleDistance;
