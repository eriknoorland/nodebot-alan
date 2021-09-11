const CELL_EMPTY = 0;
const CELL_ROBOT = 1;
const CELL_CAN = 2;

const cellSize = 50;
const numRows = arenaWidth / cellSize;
const numColumns = arenaHeight / cellSize;
const grid = [];
const cans = [];

const canDetection = (arena, lidarData) => {

  for (let row = 0; row < numRows; row++) {
    grid[row] = [];

    for (let column = 0; column < numColumns; column++) {
      grid[row][column] = CELL_EMPTY;
    }
  }

  const pose = motion.getPose();
  const posX = Math.floor(pose.x / cellSize);
  const posY = Math.floor(pose.y / cellSize);

  grid[posY][posX] = CELL_ROBOT;
  grid.forEach((row) => console.log(row.toString()));

  // FIXME filter lidarData
  // if (!isNaN(angle) && angle >= 0 && (angle >= 300 || angle <= 60)) { ??

  Object
    .keys(lidarData)
    .forEach((key) => {
      const angle = parseInt(key, 10);
      const distance = lidarData[key];

      if (distance > 120) {
        const canX = pose.x + Math.cos(angle * (Math.PI / 180)) * distance;
        const canY = pose.y + Math.sin(angle * (Math.PI / 180)) * distance;

        const canColumn = Math.floor(canX / cellSize);
        const canRow = Math.floor(canY / cellSize);

        if (canRow > 0 && canRow < grid.length - 1) {
          if (canColumn > 0 && canColumn < grid[canRow].length - 1) {
            const nearbyCans = cans.filter(can => {
              const canDistance = Math.sqrt(Math.pow(canX - can.x, 2) + Math.pow(canY - can.y, 2));

              return canDistance < 80;
            });

            if (!nearbyCans.length) {
              cans.push({
                // angle,
                // distance,
                x: canX,
                y: canY,
                column: canColumn,
                row: canRow
              });

              grid[canRow][canColumn] = CELL_CAN;
            }
          }
        }
      }
    });

  console.log(`${cans.length} cans found!`);

  grid.forEach((row) => console.log(row.toString()));
};

export default canDetection;