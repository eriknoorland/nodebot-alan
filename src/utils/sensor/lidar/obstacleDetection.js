const robotlib = require('robotlib');
const cellStates = require('../../cellStates');

const { calculateDistance, deg2rad, numberInRange } = robotlib.utils.math;

const checkCells = (matrix, row, column) => {
  for (let r = -1; r <= 1; r += 1) {
    for (let c = -1; c <= 1; c += 1) {
      if (matrix[row + r][column + c] !== cellStates.EMPTY) {
        return false;
      }
    }
  }

  return true;
}

const canDetection = (matrix, pose, lidarData, resolution = 50) => {
  const minObstacleDistance = 200;
  const obstacles = [];

  Object
    .keys(lidarData)
    .filter(key => !!lidarData[key])
    .forEach(key => {
      const angle = parseInt(key, 10);
      const distance = lidarData[key];
      const obstacle = {
        x: pose.x + Math.cos(pose.phi + deg2rad(angle)) * distance,
        y: pose.y + Math.sin(pose.phi + deg2rad(angle)) * distance,
      };
      const column = Math.floor(obstacle.x / resolution);
      const row = Math.floor(obstacle.y / resolution);
      const columnOffset = 2;

      const isWithinYLimits = numberInRange(row, columnOffset, matrix.length - (1 + columnOffset));
      const isWithinXLimits = isWithinYLimits && numberInRange(column, columnOffset, matrix[row].length - (1 + columnOffset));
      const isWithinBounds = isWithinXLimits && checkCells(matrix, row, column);

      if (isWithinBounds) {
        const nearbyObstacles = obstacles.filter(knownObstacle => calculateDistance(knownObstacle, obstacle) < minObstacleDistance);

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
