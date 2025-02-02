const findLines = (numPoints: number, cosTable, sinTable, rhoMax: number, accum) => {
  const peaks = [];

  for (let theta = 0; theta < accum.length; theta += 1) {
    for (let rho = 0; rho < accum[theta].length; rho += 1) {
      if (accum[theta][rho] >= numPoints) {
        peaks.push({ rho, theta });
      }
    }
  }

  const lines = peaks.map(({ rho, theta }) => {
    rho <<= 1;
    rho -= rhoMax;

    const a = cosTable[theta];
    const b = sinTable[theta];
    const x1 = a * rho + 100 * (-b);
    const y1 = (b * rho + 100 * (a));
    const x2 = a * rho - 100 * (-b);
    const y2 = (b * rho - 100 * (a));

    return { x1, y1, x2, y2 };
  });

  return lines;
};

export default findLines;