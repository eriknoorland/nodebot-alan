import { IConfig } from './config';
import { IDevices } from './utils/identifyUSBDevices';

export default async (logger, config: IConfig, expectedDevices: IDevices): Promise<Record<string, unknown>> => {
  const expectedDeviceIds = Object.keys(expectedDevices);
  const devices: Record<string, unknown> = {};

  for (let i = 0; i < expectedDeviceIds.length; i += 1) {
    const deviceId = expectedDeviceIds[i];
    const device = expectedDevices[deviceId];

    if (device) {
      try {
        devices[deviceId] = await device.init(device, config)!;
        logger.info(`${deviceId} initialized!`);
      } catch (error) {
        logger.error(error);
      }
    }
  }

  return devices;
};