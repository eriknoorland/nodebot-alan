const IMU = require('node-imu');

/**
 * Initialize IMU
 * @param {String} portName
 * @return {Object}
 */
const initIMU = portName => new Promise((resolve, reject) => {
  if (!portName) {
    reject('IMU not found');
    return;
  }

  const imu = IMU(portName);
  const errorTimeout = setTimeout(() => {
    reject('IMU timed out');
  }, 5000);

  imu.init()
    .then(() => {
      clearTimeout(errorTimeout);
      resolve(imu);
    });
});

module.exports = initIMU;