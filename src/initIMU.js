const initIMU = ({ path, package }) => new Promise((resolve, reject) => {
  if (!path) {
    reject('IMU not found');
    return;
  }

  if (!package) {
    reject('no IMU package available');
  }

  const imu = package(path);
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