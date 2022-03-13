const EventEmitter = require('events');

module.exports = () => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const { getArenaMatrix, cellStates } = utils;
  const { verifyRotation, verifyPosition, localiseCans } = helpers;
  const { motion } = actuators;

  async function start() {
    const matrixResolution = 30;

    motion.setTrackPose(true);

    const scanRadius = 900;
    const matrix = getArenaMatrix(arena.width, arena.height, matrixResolution);

    await verifyRotation(90, 60);
    await verifyPosition(arena, 0);

    const scanPose = motion.getPose();
    const localisedCans = await localiseCans(scanRadius, matrix, scanPose, matrixResolution);

    // mark matrix
    const pose = motion.getPose();
    const row = Math.floor(pose.y / matrixResolution);
    const column = Math.floor(pose.x / matrixResolution);

    matrix[row][column] = '|';
    localisedCans.forEach(({ row, column }) => matrix[row][column] = cellStates.OBSTACLE);

    // visualize
    matrix.forEach(row => console.log(row.toString()));

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
