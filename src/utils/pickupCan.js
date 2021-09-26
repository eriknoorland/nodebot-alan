const robotlib = require('robotlib');
const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const filterMeasurements = require('../utils/sensor/lidar/filterMeasurements');

const { pause } = robotlib.utils;
const { deg2rad } = robotlib.utils.math;

const pickupCan = async (config, lidar, motion, gripper) => {
  const canAngleScanData = await scan(lidar, 1000);
  const canAngleAveragedMeasurements = averageMeasurements(canAngleScanData);
  const canAngleFilteredAngleMeasurements = filterMeasurements(canAngleAveragedMeasurements, a => a > 330 || a < 30);
  const canAngleFilteredDistanceMeasurements = filterMeasurements(canAngleFilteredAngleMeasurements, a => canAngleFilteredAngleMeasurements[a] < (config.GRIPPER_OBSTACLE_DISTANCE + 80));
  const normalizedAngles = Object
    .keys(canAngleFilteredDistanceMeasurements)
    .map(a => ({
      angle: parseInt(a > 180 ? (360 - a) * -1 : a, 10),
      distance: canAngleFilteredDistanceMeasurements[a],
    }));

  const sortedAngles = normalizedAngles.slice(0).sort((a, b) => a.angle - b.angle);
  const canCenter = sortedAngles[Math.floor(sortedAngles.length / 2)];

  if (!canCenter) {
    return Promise.reject();
  }

  const rotationAngle = canCenter.angle;
  const canDistance = canCenter.distance;
  const lidarAngleOffset = 1;

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