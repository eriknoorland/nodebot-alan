const EventEmitter = require('events');

// FIXME refactor this to create points in the global coordinate
// system instead of sending both poses and observations

module.exports = (odometry, lidar) => {
  const eventEmitter = new EventEmitter();
  let observations = {};

  function constructor() {
    if (!lidar || !odometry) {
      return;
    }

    lidar.on('data', onLidarData);
    odometry.on('pose', onPose);
  }

  function onPose(pose) {
    eventEmitter.emit('pose', {
      ...pose,
      observations,
    });

    observations = {};
  }

  function onLidarData({ angle, distance }) {
    if (distance) {
      const index = Math.round(angle) % 360;

      observations[index] = distance;
    }
  }

  constructor();

  return {
    on: eventEmitter.on.bind(eventEmitter),
    off: eventEmitter.off.bind(eventEmitter),
  };
};