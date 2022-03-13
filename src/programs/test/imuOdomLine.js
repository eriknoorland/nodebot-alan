const EventEmitter = require('events');

module.exports = () => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const STATE_IDLE = 'idle';
  const STATE_CALIBRATION = 'calibration';
  const STATE_LINE_FOLLOWING = 'lineFollowing';
  const STATE_DONE = 'done';

  const { motion } = actuators;
  const { line } = sensors;
  const { constrain } = utils.robotlib;
  const { deg2rad } = utils.robotlib.math;

  const calibrationData = [];
  const maxSpeed = 300;
  const speed = maxSpeed - 100;
  const Kp = 40;

  let lastError = 0;
  let numTimesBelowThreshold = 0;
  let state = STATE_IDLE;
  let minValue;
  let maxValue;
  let meanValue;

  function start() {
    line.on('data', onLineData);

    motion.setTrackPose(true);
    motion.appendPose({ x: 700, y: 100, phi: 0 });

    setTimeout(calibrate, 1000);
  }

  function stop() {
    state = STATE_DONE;

    line.off('data', onLineData);

    motion.stop();
    motion.setTrackPose(false);

    eventEmitter.emit('stop');
  }

  function missionComplete() {
    eventEmitter.emit('mission_complete');
  }

  async function calibrate() {
    const rotationOffset = 20;

    state = STATE_CALIBRATION;

    await motion.rotate(deg2rad(-rotationOffset));
    await motion.rotate(deg2rad(rotationOffset * 2));
    await motion.rotate(deg2rad(-rotationOffset));

    minValue = Math.min(...calibrationData);
    maxValue = Math.max(...calibrationData);
    meanValue = (minValue + maxValue) / 2;

    state = STATE_LINE_FOLLOWING;
  }

  function lineFollowing(data) {
    if (data.every(value => value < meanValue)) {
      return ++numTimesBelowThreshold <= 20;
    }

    const maxValue = Math.max(...data.filter(value => value > meanValue));
    const index = data.indexOf(maxValue);
    const error = index !== -1 ? index - 3.5 : lastError;
    const leftSpeed = constrain(Math.round(speed + (error * Kp)), 0, maxSpeed);
    const rightSpeed = constrain(Math.round(speed - (error * Kp)), 0, maxSpeed);

    motion.speedLeftRight(leftSpeed, rightSpeed);
    numTimesBelowThreshold = 0;
    lastError = error;

    return true;
  }

  function onLineData(data) {
    if (state === STATE_CALIBRATION) {
      calibrationData.push(...data);
      return;
    }

    if (state === STATE_LINE_FOLLOWING) {
      if (!lineFollowing(data)) {
        missionComplete();
      }
    }
  }

  constructor();

  return {
    events: eventEmitter,
    start,
    stop,
  };
};
