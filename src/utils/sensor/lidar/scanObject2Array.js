/**
 * Converts a scan object two an array of objects
 * @param {Object} measurements
 * @return {Array}
 */
 const scanObject2Array = (measurements) => Object.keys(measurements)
 .map((a) => {
   const angle = parseInt(a, 10);
   const distance = measurements[angle];

   return { angle, distance };
 });

module.exports = scanObject2Array;
