const robotlib = require('robotlib');
const scan = require('../../utils/sensor/lidar/scan');
const averageMeasurements = require('../../utils/sensor/lidar/averageMeasurements');
const scanObject2Array = require('../../utils/sensor/lidar/scanObject2Array');
const getShortestDistance = require('../../utils/sensor/lidar/getShortestDistance');
const pickupCan = require('../../utils/pickupCan');
const dropCan = require('../../utils/dropCan');

const { deg2rad } = robotlib.utils.math;

module.exports = ({ config, arena, logger, controllers, sensors }) => {
  const { motion, gripper } = controllers;
  const { lidar } = sensors;

  function constructor() {
    logger.log('constructor', 'cans');
  }

  async function start() {
    logger.log('start', 'cans');

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
    await pickupCan(config, lidar, motion, gripper);

    await motion.move2XY(pose);
    await dropCan(config, gripper);

    testComplete();
  }

  function stop() {
    logger.log('stop', 'cans');
    motion.stop(true);
  }

  function testComplete() {
    logger.log('test complete', 'cans');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};
