module.exports = async (logger, config, expectedDevices) => {
  const expectedDeviceIds = Object.keys(expectedDevices);
  const devices = {};

  for (let i = 0; i < expectedDeviceIds.length; i += 1) {
    const deviceId = expectedDeviceIds[i];
    const device = expectedDevices[deviceId];

    if (device) {
      try {
        devices[deviceId] = await device.init(device, config, devices);
        logger.info(`${deviceId} initialized!`);
      } catch (error) {
        logger.error(error);
      }
    }
  }

  return Promise.resolve(devices);
};