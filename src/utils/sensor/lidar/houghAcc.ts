const houghAcc = (arenaHeight: number, cosTable, sinTable, rhoMax: number, acc, { x, y }) => {
  x -= arenaHeight / 2;
  y -= arenaHeight / 2;

  for (let thetaIndex = 0; thetaIndex < numAngleCells; thetaIndex += 1) {
    let rho = rhoMax + x * cosTable[thetaIndex] + y * sinTable[thetaIndex];
    rho >>= 1;

    if (!acc[thetaIndex]) {
      acc[thetaIndex] = [];
    }

    if (!acc[thetaIndex][rho]) {
      acc[thetaIndex][rho] = 1;
    } else {
      acc[thetaIndex][rho] += 1;
    }
  }

  return acc;
}

module.exports = houghAcc;