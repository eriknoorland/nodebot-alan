const robotlib = require('robotlib');
const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
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
      x: pose.x + Math.cos(deg2rad(angle)) * (distance - config.GRIPPER_OBSTACLE_DISTANCE),
      y: pose.y + Math.sin(deg2rad(angle)) * (distance - config.GRIPPER_OBSTACLE_DISTANCE),
    };

    motion.appendPose(pose);
    await motion.move2XY(pickupCanPosition);

    await gripper.setJawAngle(config.GRIPPER_JAW_CLOSE_ANGLE);
    await robotlib.utils.pause(250);
    await gripper.setLiftAngle(config.GRIPPER_LIFT_UP_ANGLE);

    await motion.move2XY(pose);

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
