const robotlib = require('robotlib');
const locateCan = require('./locateCan');

const { pause } = robotlib.utils;
const { deg2rad } = robotlib.utils.math;

const pickupCan = async (config, lidar, motion, gripper) => {
  let canCenter;

  try {
    canCenter = await locateCan(config, lidar);
  } catch(error) {
    return Promise.reject();
  }

  const rotationAngle = canCenter.angle;
  const canDistance = canCenter.distance;
  const lidarAngleOffset = -1;

  await pause(250);

  if (rotationAngle) {
    await motion.rotate(deg2rad(rotationAngle + lidarAngleOffset));
    await pause(250);
  }
  else {
    // FIXME where is the can if not within a 60 degree opening angle?
  }

  const adjustmentDistance = canDistance - config.GRIPPER_OBSTACLE_PICKUP_DISTANCE
  const adjustmentHeading = motion.getPose().phi;

  await motion.distanceHeading(adjustmentDistance, adjustmentHeading);

  await gripper.setJawAngle(config.GRIPPER_JAW_CLOSE_ANGLE);
  await pause(250);

  await gripper.setLiftAngle(config.GRIPPER_LIFT_UP_ANGLE);
  await pause(250);

  return Promise.resolve();
};

module.exports = pickupCan;
