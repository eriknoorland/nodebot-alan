const robotlib = require('robotlib');

const { pause } = robotlib.utils;

const dropCan = async (config, gripper) => {
  await pause(250);

  await gripper.setLiftAngle(config.GRIPPER_LIFT_DOWN_ANGLE);
  await pause(250);

  await gripper.setJawAngle(config.GRIPPER_JAW_OPEN_ANGLE);
  await pause(250);

  return Promise.resolve();
};

module.exports = dropCan;