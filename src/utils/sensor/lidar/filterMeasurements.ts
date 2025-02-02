const filterMeasurements = (measurements, filter) => Object
  .keys(measurements)
  .filter(filter)
  .reduce((acc, a) => {
    acc[a] = measurements[a];
    return acc;
  }, {});

export default filterMeasurements;