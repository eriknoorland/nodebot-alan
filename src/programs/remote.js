const scan = require('../utils/sensor/lidar/scan');
const averageMeasurements = require('../utils/sensor/lidar/averageMeasurements');
const getInitialPosition = require('../utils/motion/getInitialPosition');

module.exports = ({ config, arena, logger, controllers, sensors, socket }) => {
  const { motion, gripper } = controllers;
  const { lidar } = sensors;

  let currentPose = {};

  function constructor() {
    logger.log('constructor', 'remote');
  }

  async function start() {
    logger.log('start', 'remote');

    // const scanData = await scan(lidar, 2000);
    // const averagedMeasurements = averageMeasurements(scanData);
    // const { x, y } = getInitialPosition(averagedMeasurements, arena.height);

    motion.on('pose', onPose);
    motion.setTrackPose(true);
    motion.appendPose({ x: 190, y: arena.height * 0.75, phi: 0 }); // FIXME after start vector solving

    socket.on('ArrowUp', forward);
    socket.on('ArrowDown', reverse);
    socket.on('Space', stopMotors);
    socket.on('ArrowLeft', rotateLeft);
    socket.on('ArrowRight', rotateRight);

    socket.on('KeyY', onGripperLower);
    socket.on('KeyU', onGripperLift);
    socket.on('KeyI', onGripperOpen);
    socket.on('KeyO', onGripperWideOpen);
    socket.on('KeyP', onGripperClose);

    socket.on('waypoints', waypoints);
  }

  function stop() {
    logger.log('stop', 'remote');

    motion.off('pose', onPose);

    socket.removeListener('ArrowUp', forward);
    socket.removeListener('ArrowDown', reverse);
    socket.removeListener('Space', stopMotors);
    socket.removeListener('ArrowLeft', rotateLeft);
    socket.removeListener('ArrowRight', rotateRight);

    socket.removeListener('KeyY', onGripperLower);
    socket.removeListener('KeyU', onGripperLift);
    socket.removeListener('KeyI', onGripperOpen);
    socket.removeListener('KeyO', onGripperWideOpen);
    socket.removeListener('KeyP', onGripperClose);

    socket.removeListener('waypoints', waypoints);
  }

  function forward() {
    const heading = currentPose.phi || 0;

    motion.speedHeading(config.MAX_SPEED, heading, () => {});
  }

  function reverse() {
    const heading = currentPose.phi || 0;

    motion.speedHeading(-config.MAX_SPEED, heading, () => {});
  }

  function stopMotors() {
    motion.stop();
  }

  function rotateLeft() {
    motion.rotate(-Math.PI / 2);
  }

  function rotateRight() {
    motion.rotate(Math.PI / 2);
  }

  function onGripperLower () {
    gripper.setLiftAngle(config.GRIPPER_LIFT_DOWN_ANGLE);
  }

  function onGripperLift () {
    gripper.setLiftAngle(config.GRIPPER_LIFT_UP_ANGLE);
  }

  function onGripperOpen () {
    gripper.setJawAngle(config.GRIPPER_JAW_OPEN_ANGLE);
  }

  function onGripperWideOpen () {
    gripper.setJawAngle(config.GRIPPER_JAW_WIDE_OPEN_ANGLE);
  }

  function onGripperClose () {
    gripper.setJawAngle(config.GRIPPER_JAW_CLOSE_ANGLE);
  }

  function waypoints(waypoints) {
    waypoints.reduce((acc, waypoint) => acc.then(_ => motion.move2XY(waypoint)), Promise.resolve());
  }

  function onPose(pose) {
    currentPose = pose;
  }

  constructor();

  return {
    start,
    stop,
  };
};
