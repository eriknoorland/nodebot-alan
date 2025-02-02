/**
 * Returns an object containing averaged measured angle distances
 * @param {Object} measurements
 * @return {Object}
 */
const averageMeasurements = measurements => {
  const sum = (acc, value) => (acc + value);

  return Object.keys(measurements)
    .reduce((acc, angle) => {
      const angleMeasurements = measurements[angle];
      const total = angleMeasurements.reduce(sum, 0);
      const average = Math.floor(total / angleMeasurements.length);

      acc[angle] = average;

      return acc;
    }, {});
};

export default averageMeasurements;
