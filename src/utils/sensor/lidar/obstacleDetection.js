const { math } = require('@eriknoorland/nodebot-utils');
const cellStates = require('../../cellStates');

const { calculateDistance, deg2rad, numberInRange } = math;

// const checkCells = (matrix, row, column) => {
//   for (let r = -1; r <= 1; r += 1) {
//     for (let c = -1; c <= 1; c += 1) {
//       if (matrix[row + r][column + c] !== cellStates.EMPTY) {
//         return false;
//       }
//     }
//   }

//   return true;
// }

const isEligibleToBeACan = (matrix, row, column) => {
  return matrix[row][column] === cellStates.EMPTY;
};

const isTooCloseToWall = (matrix, row, column, depth = 1) => {
  for (i = -depth; i <= depth; i += 1) {
    for (j = -depth; j <= depth; j += 1) {
      const neighbourRow = row + i;
      const neighbourColumn = column + j;
      let cellValue;

      if (neighbourRow === row && neighbourColumn === column) {
        continue;
      }

      try {
        cellValue = matrix[neighbourRow][neighbourColumn];

        if (cellValue === cellStates.WALL_OFFSET) {
          return true;
        }
      } catch(error) {
        // out of array bounds
      }
    }
  }

  return false;
};

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
      // const columnOffset = 2;

      // const isWithinYLimits = numberInRange(row, columnOffset, matrix.length - (1 + columnOffset));
      // const isWithinXLimits = isWithinYLimits && numberInRange(column, columnOffset, matrix[row].length - (1 + columnOffset));
      // const isWithinBounds = isWithinXLimits && checkCells(matrix, row, column);

      const isWithinYLimits = numberInRange(row, 0, matrix.length - 1);
      const isWithinXLimits = isWithinYLimits && numberInRange(column, 0, matrix[row].length - 1);
      const isWithinBounds = isWithinXLimits && isEligibleToBeACan(matrix, row, column) && !isTooCloseToWall(matrix, row, column, 2);

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
