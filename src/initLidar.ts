import { IConfig } from './config';
import { IDevice } from './utils/identifyUSBDevices'

const initLidar = ({ path, lib }: IDevice, config: IConfig): Promise<Object> | undefined => new Promise(async (resolve, reject) => {
  if (!path) {
    reject('lidar not found');
    return;
  }

  const lidarOptions = {
    angleOffset: config.LIDAR_ANGLE_OFFSET,
  };

  if (!lib) {
    reject('no lidar function available');
  }

  const lidar = lib(path, lidarOptions);

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

export default initLidar;