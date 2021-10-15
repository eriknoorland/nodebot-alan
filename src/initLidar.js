const RPLidar = require('node-rplidar');

/**
 * Initialize lidar
 * @param {String} portName
 * @return {Object}
 */
const initLidar = (portName, config) => new Promise(async (resolve, reject) => {
  if (!portName) {
    reject('lidar not found');
    return;
  }

  const lidarOptions = {
    angleOffset: config.LIDAR_ANGLE_OFFSET,
  };

  const lidar = RPLidar(portName, lidarOptions);
  const errorTimeout = setTimeout(() => {
    reject('lidar timed out');
  }, 5000);

  try {
    await lidar.init();

    clearTimeout(errorTimeout);
    lidar.scan();
    resolve(lidar);

  } catch(error) {
    reject(error);
  }
});

module.exports = initLidar;