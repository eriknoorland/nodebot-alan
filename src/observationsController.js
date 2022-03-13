const EventEmitter = require('events');

module.exports = (utils, odometry, lidar) => {
  const eventEmitter = new EventEmitter();
  const { deg2rad } = utils.robotlib.math;
  let lidarData = {};

  function constructor() {
    if (!lidar || !odometry) {
      return;
    }

    lidar.on('data', onLidarData);
    odometry.on('pose', onPose);
  }

  function onPose(pose) {
    const observations = Object
      .keys(lidarData)
      .map(angle => {
        const distance = lidarData[angle];
        const angleInRadians = deg2rad(parseInt(angle, 10));

        return {
          x: pose.x + (Math.cos(pose.phi + angleInRadians) * distance),
          y: pose.y + (Math.sin(pose.phi + angleInRadians) * distance),
        };
      });

    eventEmitter.emit('pose', { ...pose, observations });
    lidarData = {};
  }

  function onLidarData({ angle, distance }) {
    if (distance) {
      const index = Math.round(angle) % 360;

      lidarData[index] = distance;
    }
  }

  constructor();

  return {
    on: eventEmitter.on.bind(eventEmitter),
    off: eventEmitter.off.bind(eventEmitter),
  };
};