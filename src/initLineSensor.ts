import { IDevice } from './utils/identifyUSBDevices';

const initLineSensor = ({ path, lib }: IDevice): Promise<Object> | undefined => new Promise((resolve, reject) => {
  if (!path) {
    reject('line sensor not found');
    return;
  }

  if (!lib) {
    reject('no line sensor function available');
  }

  const lineSensor = lib(path);
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

export default initLineSensor;