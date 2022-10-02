const initLidar = ({ path, package }, config) => new Promise(async (resolve, reject) => {
  if (!path) {
    reject('lidar not found');
    return;
  }

  const lidarOptions = {
    angleOffset: config.LIDAR_ANGLE_OFFSET,
  };

  if (!package) {
    reject('no lidar package available');
  }

  const lidar = package(path, lidarOptions);

  const errorTimeout = setTimeout(() => {
    reject('lidar timed out');
  }, 5000);

  try {
    await lidar.init();

    clearTimeout(errorTimeout);

    if (lidar.scan) {
      lidar.scan();
    }

    resolve(lidar);
  } catch(error) {
    reject(error);
  }
});

module.exports = initLidar;