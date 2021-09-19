const robotlib = require('robotlib');
const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const filterMeasurements = require('../utils/sensor/lidar/filterMeasurements');
const scanObject2Array = require('../utils/sensor/lidar/scanObject2Array');
const getShortestDistance = require('../utils/sensor/lidar/getShortestDistance');

const { deg2rad } = robotlib.utils.math;

module.exports = ({ config, arena, logger, controllers, sensors }) => {
  const { motion, gripper } = controllers;
  const { lidar } = sensors;

  function constructor() {
    logger.log('constructor', 'pickupCan');
  }

  async function start() {
    logger.log('start', 'pickupCan');

    const pose = { x: 0, y: 0, phi: 0 };
    const scanData = await scan(lidar, 2000);
    const averagedMeasurements = averageMeasurements(scanData);
    const { angle, distance } = getShortestDistance(scanObject2Array(averagedMeasurements));
    const pickupCanPosition = {
      x: pose.x + Math.cos(deg2rad(angle)) * distance,
      y: pose.y + Math.sin(deg2rad(angle)) * distance,
    };

    motion.appendPose(pose);

    await motion.move2XY(pickupCanPosition, -config.GRIPPER_OBSTACLE_DISTANCE);
    await robotlib.utils.pause(250);

    /////

    const canAngleScanData = await scan(lidar, 1000);
    const canAngleAveragedMeasurements = averageMeasurements(canAngleScanData);
    const canAngleFilteredAngleMeasurements = filterMeasurements(canAngleAveragedMeasurements, a => a > 340 || a < 20);
    const canAngleFilteredDistanceMeasurements = filterMeasurements(canAngleFilteredAngleMeasurements, a => canAngleFilteredAngleMeasurements[a] < 200);
    const normalizedAngles = Object
      .keys(canAngleFilteredDistanceMeasurements)
      .map(a => parseInt(a > 180 ? (360 - a) * -1 : a, 10));
    const sortedAngles = normalizedAngles.slice(0).sort((a, b) => a - b);
    const errorOffset = 1;
    const rotationAngle = sortedAngles[Math.floor(sortedAngles.length / 2)] + errorOffset;

    await motion.rotate(deg2rad(rotationAngle));
    await robotlib.utils.pause(250);

    /////

    await gripper.setJawAngle(config.GRIPPER_JAW_CLOSE_ANGLE);
    await robotlib.utils.pause(250);
    await gripper.setLiftAngle(config.GRIPPER_LIFT_UP_ANGLE);

    await motion.move2XY(pose);
    await robotlib.utils.pause(250);

    await gripper.setLiftAngle(config.GRIPPER_LIFT_DOWN_ANGLE);
    await robotlib.utils.pause(250);
    await gripper.setJawAngle(config.GRIPPER_JAW_OPEN_ANGLE);

    missionComplete();
  }

  function stop() {
    logger.log('stop', 'pickupCan');
    motion.stop(true);
  }

  function missionComplete() {
    logger.log('mission complete', 'pickupCan');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
