module.exports = (logger, config, expectedDevices) => {
  const devices = Object
    .keys(expectedDevices)
    .reduce(async (acc, expectedDevice) => {
      const device = expectedDevices[expectedDevice];

      if (device) {
        try {
          acc[expectedDevice] = await device.init(device, config);
          logger.info(`${expectedDevice} initialized!`);
        } catch (error) {
          logger.error(error);
        }
      }

      return acc;
    }, {});

  return Promise.resolve(devices);
};