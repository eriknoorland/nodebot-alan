const robotlib = require('robotlib');

/**
 * Telemetry
 * @param {Object} config
 * @return {Object}
 */
module.exports = (socket, config, { lidar, lineSensor, motion }) => {
  let lidarData = {};
  let lineSensorData = [];
  let odometryData = [];
  // let imu = {};
  let speeds = [];
  let poses = [];
  let lastTimestamp = new Date();
  let fps = {};

  /**
   * Constructor
   */
  function constructor() {
    setInterval(setFps, config.LOOP_TIME);
    setInterval(emit, 100);

    if (lidar) {
      lidar.on('data', onLidarData);
    }

    if (lineSensor) {
      lineSensor.on('data', data => {
        lineSensorData = data.slice(0);
      });
    }

    if (motion) {
      motion.on('odometry', (data) => {
        odometryData.push(data);
      });

      motion.on('speed', (data) => {
        speeds.push(data);
      });

      motion.on('pose', (data) => {
        poses.push(data);
      });
    }
  }

  /**
   * Emit
   */
  function emit() {
    socket.emit('data', {
      lidar: lidarData,
      line: lineSensorData,
      odometry: odometryData,
      // imu,
      speeds,
      poses,
      fps,
    });

    lidarData = {};
    lineSensorData.length = 0;
    odometryData.length = 0;
    speeds.length = 0;
    poses.length = 0;
  }

  /**
   * Lidar data event handler
   * @param {Object} data
   */
  function onLidarData({ angle, distance }) {
    const index = robotlib.utils.sensor.lidar.normalizeAngle(Math.round(angle));

    lidarData[index] = distance;
  }

  /**
   * Sets the fps
   */
  function setFps() {
    const currentTimestamp = new Date();

    fps = {
      target: 1000 / config.LOOP_TIME,
      actual: 1000 / (currentTimestamp - lastTimestamp),
    };

    lastTimestamp = currentTimestamp;
  }

  constructor();

  return {};
};
