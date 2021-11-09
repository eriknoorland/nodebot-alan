module.exports = (socket, config, { lidar, lineSensor, motion }) => {
  let lidarData = {};
  let lineSensorData = [];
  let odometryData = [];
  let speeds = [];
  let poses = [];
  let lastTimestamp = new Date();
  let fps = {};

  function constructor() {
    setInterval(setFps, config.LOOP_TIME);
    setInterval(emit, 200);

    if (lidar) {
      lidar.on('data', onLidarData);
    }

    if (lineSensor) {
      lineSensor.on('data', data => {
        lineSensorData = [...data];
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

  function setup(programs) {
    socket.emit('setup', {
      programs,
      sensors: ['lidar', 'odometry', 'poses', 'line'],
      name: 'Alan',
    });
  }

  function ready() {
    socket.emit('ready');
  }

  function emit() {
    socket.emit('data', {
      lidar: lidarData,
      line: lineSensorData,
      odometry: odometryData,
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

  function onLidarData({ angle, distance }) {
    if (distance > 0) {
      const index = Math.round(angle) % 360;

      lidarData[index] = distance;
    }
  }

  function setFps() {
    const currentTimestamp = new Date();

    fps = {
      target: 1000 / config.LOOP_TIME,
      actual: 1000 / (currentTimestamp - lastTimestamp),
    };

    lastTimestamp = currentTimestamp;
  }

  constructor();

  return {
    setup,
    ready,
  };
};
