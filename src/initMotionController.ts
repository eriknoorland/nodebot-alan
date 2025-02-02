import { IConfig } from './config';
import { IDevice } from './utils/identifyUSBDevices';

const initMotionController = ({ path, lib, options }: IDevice, config: IConfig): Promise<Object> | undefined => new Promise((resolve, reject) => {
  if (!path) {
    reject('motion controller not found');
    return;
  }

  if (!lib) {
    reject('no motion function available');
  }

  const motion = lib(path, config, options);
  const errorTimeout = setTimeout(() => {
    reject('motion controller timed out');
  }, 5000);

  let isReady = false;

  const isReadyTimeout = setTimeout(() => {
    if (!isReady) {
      motion.isReady()
        .catch(reject);
    }
  }, 1000);

  const onInit = () => {
    isReady = true;
    clearTimeout(isReadyTimeout);
    clearTimeout(errorTimeout);
    resolve(motion);
  };

  motion.init()
    .then(onInit)
    .catch(reject);
});

export default initMotionController;