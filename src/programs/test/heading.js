const EventEmitter = require('events');

module.exports = (distance) => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const { pause } = utils.robotlib;
  const { averageMeasurements, getAngleDistance } = utils.sensor.lidar;
  const { scan, startVector, gotoStartPosition, getInitialPosition } = helpers;
  const { motion } = controllers;

  async function start() {
    await startVector();
    await pause(250);

    // const startPositionAveragedMeasurements = averageMeasurements(await scan(2000));
    // await gotoStartPosition(startPositionAveragedMeasurements);

    const initialPositionAveragedMeasurements = averageMeasurements(await scan(2000));
    const { x, y } = getInitialPosition(initialPositionAveragedMeasurements, arena.height);
    const startRightDistance = getAngleDistance(initialPositionAveragedMeasurements, 90);

    motion.setTrackPose(true);
    motion.appendPose({ x, y, phi: 0 });
    const startPose = motion.getPose();

    await motion.distanceHeading(distance, 0);

    const endPositionAveragedMeasurements = averageMeasurements(await scan(2000));
    const endRightDistance = getAngleDistance(endPositionAveragedMeasurements, 90);
    const distanceDiff = endRightDistance - startRightDistance;
    const endPose = motion.getPose();
    const poseDiffX = endPose.x - startPose.x;
    const poseDiffY = endPose.y - startPose.y;

    console.log({
      startRightDistance,
      endRightDistance,
      distanceDiff,
      startPose,
      endPose,
      poseDiffX,
      poseDiffY,
    });

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
