module.exports = (icpjs, utils, motion, lidar, reference, options = {}) => {
  const { deg2rad } = utils.robotlib.math;
  const updateInterval = 100;

  let estimatedPose = null;
  let odomPose = null;
  let lidarData = {};

  function constructor() {
    if (!lidar || !motion) {
      return;
    }

    motion.on('pose', onPose);
    lidar.on('data', onLidarData);

    setInterval(onUpdate, updateInterval);
  }

  function getPose() {
    return estimatedPose;
  }

  function onUpdate() {
    if (odomPose) {
      const { x, y, phi } = odomPose;
      const lidarPoints = Object
        .keys(lidarData)
        .map(angle => {
          const distance = lidarData[angle];
          const angleInRadians = deg2rad(parseInt(angle, 10));

          return {
            x: x + (Math.cos(phi + angleInRadians) * distance),
            y: y + (Math.sin(phi + angleInRadians) * distance),
          };
        });

      const icpResult = icpjs.run(reference, lidarPoints, odomPose, options);
      const { transformation } = icpResult;
      const icpPose = {
        x: x + transformation.x,
        y: y + transformation.y,
        phi: phi + transformation.phi,
      };

      estimatedPose = icpPose;
      motion.setPose(icpPose);
    }
  }

  function onPose(pose) {
    odomPose = { ...pose };
  }

  function onLidarData({ angle, distance }) {
    if (distance) {
      const index = Math.round(angle) % 360;

      lidarData[index] = distance;
    }
  }

  constructor();

  return {
    getPose,
  };
};