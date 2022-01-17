const initLidar = require('./initLidar');
const initIMU = require('./initIMU');
const initGripper = require('./initGripper');
const initLineSensor = require('./initLineSensor');
const initMotionController = require('./initMotionController');

module.exports = async (logger, config, expectedDevices) => {
  const { lidar, imu, gripper, line, motion } = expectedDevices;
  const devices = {};

  try {
    devices.lidar = await initLidar(lidar, config);
    logger.info('lidar initialized!');
  } catch(error) {
    logger.error(error);
  }

  try {
    devices.imu = await initIMU(imu, config);
    logger.info('IMU initialized!');
  } catch(error) {
    logger.error(error);
  }

  try {
    devices.gripper = await initGripper(gripper, config);
    logger.info('gripper initialized!');
  } catch(error) {
    logger.error(error);
  }

  try {
    devices.line = await initLineSensor(line);
    logger.info('line sensor initialized!');
  } catch(error) {
    logger.error(error);
  }

  try {
    const options = {
      imu: devices.imu,
    };

    devices.motion = await initMotionController(motion, config, options);
    logger.info('motion controller initialized!');
  } catch(error) {
    logger.error(error);
  }

  return Promise.resolve(devices);
};