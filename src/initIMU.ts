import { IDevice } from './utils/identifyUSBDevices';

const initIMU = ({ path, lib }: IDevice): Promise<Object> | undefined => new Promise(async (resolve, reject) => {
  if (!path) {
    reject('IMU not found');
    return;
  }

  if (!lib) {
    reject('no IMU function available');
  }

  const imu = lib(path);
  const errorTimeout = setTimeout(() => {
    reject('IMU timed out');
  }, 5000);

  imu.init()
    .then(() => {
      clearTimeout(errorTimeout);
      resolve(imu);
    });
});

export default initIMU;