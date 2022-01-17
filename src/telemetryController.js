module.exports = (socket, config, sensors, missions) => {
  const { odometry, lidar, line, observations } = sensors;
  const emitInterval = 250;

  let lastTimestamp = new Date();
  let lidarData = {};
  let lineData = [];
  let odometryData = [];
  let speeds = [];
  let poses = [];
  let odomPoses = [];
  let imuPoses = [];
  let fps = {
    target: 1000 / config.LOOP_TIME,
    actual: 0,
  };

  function constructor() {
    setup();
    setInterval(setFps, config.LOOP_TIME);
    setInterval(emit, emitInterval);
    bindEvents();
  }

  function setSocket(s) {
    socket = s;
  }

  function setup() {
    const availableSensors = Object
      .keys(sensors)
      .filter(v => !!sensors[v]);

    socket.emit('setup', {
      name: config.NAME,
      sensors: availableSensors,
      programs: missions,
    });
  }

  function ready() {
    socket.emit('ready');
  }

  function bindEvents() {
    if (lidar) {
      lidar.on('data', onLidarData);
    }

    if (line) {
      line.on('data', onLineData);
    }

    if (odometry) {
      odometry.on('odometry', data => odometryData.push(data));
      odometry.on('speed', data => speeds.push(data));
      odometry.on('pose_odom', data => odomPoses.push(data));
      odometry.on('pose_imu', data => imuPoses.push(data));
    }

    if (observations) {
      observations.on('pose', data => poses.push(data));
    }
  }

  function emit() {
    socket.emit('data', {
      lidar: lidarData,
      line: lineData,
      odometry: odometryData,
      speeds,
      poses,
      odomPoses,
      imuPoses,
      fps,
    });

    lidarData = {};
    lineData.length = 0;
    odometryData.length = 0;
    speeds.length = 0;
    poses.length = 0;
    odomPoses.length = 0;
    imuPoses.length = 0;
  }

  function onLidarData({ angle, distance }) {
    if (distance) {
      const index = Math.round(angle) % 360;

      lidarData[index] = distance;
    }
  }

  function onLineData(data) {
    lineData = [...data];
  }

  function setFps() {
    const currentTimestamp = new Date();

    fps.actual = 1000 / (currentTimestamp - lastTimestamp);
    lastTimestamp = currentTimestamp;
  }

  constructor();

  return {
    setSocket,
    setup,
    ready,
  };
};
