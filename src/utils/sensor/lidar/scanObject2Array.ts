/**
 * Converts a scan object to an array of objects
 * @param {Object} measurements
 * @return {Array}
 */
 const scanObject2Array = measurements => Object
  .keys(measurements)
  .map(a => {
    const angle = parseInt(a, 10);
    const distance = measurements[angle];

    return { angle, distance };
  });

export default scanObject2Array;
