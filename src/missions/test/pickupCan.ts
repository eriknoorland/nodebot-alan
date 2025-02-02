import EventEmitter from 'events';

export default () => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const { deg2rad } = utils.robotlib.math;
  const { averageMeasurements, scanObject2Array, getShortestDistance } = utils.sensor.lidar;
  const { scan, pickupCan, dropCan } = helpers;
  const { motion } = actuators;

  async function start() {
    const pose = { x: 0, y: 0, phi: 0 };
    const measurements = averageMeasurements(await scan(2000));
    const { angle, distance } = getShortestDistance(scanObject2Array(measurements));
    const pickupCanPosition = {
      x: pose.x + Math.cos(deg2rad(angle)) * distance,
      y: pose.y + Math.sin(deg2rad(angle)) * distance,
    };

    motion.appendPose(pose);

    await motion.move2XY(pickupCanPosition, -config.GRIPPER_OBSTACLE_DISTANCE);

    try {
      const canCenter = await helpers.locateCan(config);
      await pickupCan(config, canCenter);
    } catch (error) {
      console.log(error);
    }

    await motion.move2XY(pose);
    await dropCan(config);

    eventEmitter.emit('mission_complete');
  }

  function stop() {
    motion.stop(true);
  }

  return {
    events: eventEmitter,
    start,
    stop,
  };
};
