const robotlib = require('robotlib');
const { calculateDistance, deg2rad, numberInRange } = robotlib.utils.math;

const canDetection = (matrix, pose, lidarData, resolution = 50) => {
  const obstacles = [];

  Object
    .keys(lidarData)
    .filter(key => !!lidarData[key])
    .forEach(key => {
      const angle = parseInt(key, 10);
      const distance = lidarData[key];
      const obstacle = {
        obstacleX: pose.x + Math.cos(deg2rad(angle)) * distance,
        obstacleY: pose.y + Math.sin(deg2rad(angle)) * distance,
      };
      const column = Math.floor(obstacle.x / resolution);
      const row = Math.floor(obstacle.y / resolution);
      const isWithinYLimits = numberInRange(row, 0, matrix.length - 1);
      const isWithinXLimits = isWithinYLimits && numberInRange(column, 0, matrix[row].length - 1);
      const isWithinBounds = isWithinXLimits && matrix[row][column] > 1;

      if (isWithinBounds) {
        const nearbyObstacles = obstacles.filter(knownObstacle => calculateDistance(knownObstacle, obstacle) < 80);

        if (!nearbyObstacles.length) {
          obstacles.push({
            ...obstacle,
            row,
            column,
          });
        }
      }
    });

  return obstacles;
};

module.exports = canDetection;