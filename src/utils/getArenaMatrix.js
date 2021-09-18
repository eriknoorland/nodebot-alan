/*
      _____
     |     |
 ____|     |____
|               |
|_______________|

*/

const CELL_OUT_OF_BOUNDS = 0;
const CELL_WALL_OFFSET = 1;
const CELL_EMPTY = 2;
const CELL_OBSTACLE = 3;

function generateMatrix(numRows, numColumns) {
  const grid = [];

  for (let row = 0; row < numRows; row++) {
    grid[row] = [];

    for (let col = 0; col < numColumns; col++) {
      grid[row].push(CELL_EMPTY);
    }
  }

  // adjust rectangle to t-shape with out of bounds value
  for (let row = 0, numRows = grid.length / 2; row < numRows; row++) {
    for (let col = 0, numColumns = grid[row].length; col < numColumns; col++) {
      if (col < grid[row].length / 3 || col >= (grid[row].length / 3) * 2) {
        grid[row][col] = CELL_OUT_OF_BOUNDS;
      }
    }
  }

  // add wall offsets
  for (let row = 0, numRows = grid.length; row < numRows; row++) {
    for (let col = 0, numColumns = grid[row].length; col < numColumns; col++) {
      if (grid[row][col] !== CELL_OUT_OF_BOUNDS) {
        const isFirstOrLastRow = row === 0 || row === numRows - 1;
        const isFirstOrLastColumn = col === 0 || col === numColumns - 1;

        if (isFirstOrLastRow || isFirstOrLastColumn) {
          grid[row][col] = CELL_WALL_OFFSET;
          continue;
        }

        const isLeftOutOfBounds = grid[row][col - 1] === CELL_OUT_OF_BOUNDS;
        const isRightOutOfBounds = grid[row][col + 1] === CELL_OUT_OF_BOUNDS;

        if (isLeftOutOfBounds || isRightOutOfBounds) {
          grid[row][col] = CELL_WALL_OFFSET;
          continue;
        }

        const isTopOutOfBounds = grid[row -1][col] === CELL_OUT_OF_BOUNDS;

        if (isTopOutOfBounds) {
          grid[row][col] = CELL_WALL_OFFSET;
          continue;
        }
      }
    }
  }

  return grid;
}

const getArenaMatrix = (arenaWidth, arenaHeight, resolution = 50) => {
  const numRows = arenaHeight / resolution;
  const numColumns = arenaWidth / resolution;

  return generateMatrix(numRows, numColumns);
};

module.exports = getArenaMatrix;