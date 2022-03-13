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

  let isReady = false;

  const isReadyTimeout = setTimeout(() => {
    if (!isReady) {
      lineSensor.isReady()
        .catch(reject);
    }
  }, 2500);

  const onInit = () => {
    isReady = true;
    clearTimeout(isReadyTimeout);
    clearTimeout(errorTimeout);
    resolve(lineSensor);
  };

  lineSensor.init()
    .then(onInit)
    .catch(reject);
});

module.exports = initLineSensor;