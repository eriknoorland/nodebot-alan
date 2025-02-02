import { IConfig } from './config';
import { IDevice } from './utils/identifyUSBDevices';

const initGripper = ({ path, lib }: IDevice, config: IConfig): Promise<Object> | undefined => new Promise((resolve, reject) => {
  if (!path) {
    reject('gripper not found');
    return;
  }

  if (!lib) {
    reject('no gripper function available');
  }

  const gripper = lib(path);
  const errorTimeout = setTimeout(() => {
    reject('gripper timed out');
  }, 5000);

  let isReady = false;

  const isReadyTimeout = setTimeout(() => {
    if (!isReady) {
      gripper.isReady()
        .catch(reject);
    }
  }, 2500);

  const onInit = () => {
    isReady = true;

    clearTimeout(isReadyTimeout);
    clearTimeout(errorTimeout);

    gripper.setLiftAngle(config.GRIPPER_LIFT_DOWN_ANGLE);
    gripper.setJawAngle(config.GRIPPER_JAW_OPEN_ANGLE);

    resolve(gripper);
  };

  gripper.init()
    .then(onInit)
    .catch(reject);
});

export default initGripper;