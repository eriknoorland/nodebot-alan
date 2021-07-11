const LineSensor = require('line-sensor');

/**
 * Initialize line sensor
 * @param {String} portName
 * @return {Object}
 */
const initLineSensor = portName => new Promise((resolve, reject) => {
  if (!portName) {
    reject('line sensor not found');
    return;
  }

  const lineSensor = LineSensor(portName);
  const errorTimeout = setTimeout(() => {
    reject('line sensor timed out');
  }, 5000);

  lineSensor.init()
    .then(() => {
      clearTimeout(errorTimeout);
      resolve(lineSensor);
    });
});

module.exports = initLineSensor;