const robotlib = require('robotlib');
const cellStates = require('../../cellStates');

const { calculateDistance, deg2rad, numberInRange } = robotlib.utils.math;

// TODO verify this new check
const checkCells = (matrix, row, column) => {
  for (let r = -1; r <= 1; r += 1) {
    for (let c = -1; c <= 1; c += 1) {
      if (matrix[row + r][column + c] !== cellStates.EMPTY) {
        return false;
      }
    }
  }

  return true;

  // return matrix[row - 1][column - 1] === 2
  //   && matrix[row - 1][column] === 2
  //   && matrix[row - 1][column + 1] === 2

  //   && matrix[row][column - 1] === 2
  //   && matrix[row][column + 1] === 2

  //   && matrix[row + 1][column - 1] === 2
  //   && matrix[row + 1][column] === 2
  //   && matrix[row + 1][column + 1] === 2
}

const canDetection = (matrix, pose, lidarData, resolution = 50) => {
  const obstacles = [];

  Object
    .keys(lidarData)
    .filter(key => !!lidarData[key])
    .forEach(key => {
      const angle = parseInt(key, 10);
      const distance = lidarData[key];
      const obstacle = {
        x: pose.x + Math.cos(deg2rad(angle)) * distance,
        y: pose.y + Math.sin(deg2rad(angle)) * distance,
      };
      const column = Math.floor(obstacle.x / resolution);
      const row = Math.floor(obstacle.y / resolution);
      const columnOffset = 1;

      const isWithinYLimits = numberInRange(row, columnOffset, matrix.length - (1 + columnOffset));
      const isWithinXLimits = isWithinYLimits && numberInRange(column, columnOffset, matrix[row].length - (1 + columnOffset));
      // const isWithinBounds = isWithinXLimits && matrix[row][column] > 1;
      const isWithinBounds = isWithinXLimits && /*matrix[row][column] > 1 &&*/ checkCells(matrix, row, column);

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
