const Gripper = require('node-gripper');

/**
 * Initialize gripper
 * @param {String} portName
 * @param {Object} config
 * @return {Object}
 */
const initGripper = (portName, config) => new Promise((resolve, reject) => {
  if (!portName) {
    reject('gripper not found');
    return;
  }

  const gripper = Gripper(portName);
  const errorTimeout = setTimeout(() => {
    reject('gripper timed out');
  }, 5000);

  gripper.init()
    .then(() => {
      clearTimeout(errorTimeout);

      gripper.setLiftAngle(config.GRIPPER_LIFT_DOWN_ANGLE);
      gripper.setJawAngle(config.GRIPPER_JAW_OPEN_ANGLE);

      resolve(gripper);
    });
});

module.exports = initGripper;