/**
 * Returns an object containing averaged measured angle distances
 * @param {Object} angleMeasurements
 * @return {Promise}
 */
 const averageMeasurements = angleMeasurements => {
  const sum = (acc, value) => (acc + value);

  return Promise.resolve(Object.keys(angleMeasurements)
    .reduce((acc, angle) => {
      const measurements = angleMeasurements[angle];
      const total = measurements.reduce(sum, 0);
      const average = Math.floor(total / measurements.length);

      acc[angle] = average;

      return acc;
    }, {}));
};

module.exports = averageMeasurements;
