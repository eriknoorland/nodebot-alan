const mapLidarData2Points = require('../utils/sensor/lidar/mapLidarData2Points');
const houghAcc = require('../utils/sensor/lidar/houghAcc');
const findLines = require('../utils/sensor/lidar/findLines');
const findCorners = require('../utils/sensor/lidar/findCorners');

/**
 *
 * @param {Object} measurements
 * @param {Object} motion
 * @param {Number} arenaHeight
 */
const solveStartVectorHough = (measurements, arenaHeight, numAngleCells, motion) => {
  const rhoMax = Math.sqrt((arenaHeight ** 2) + (arenaHeight ** 2));
  const cosTable = new Array(numAngleCells);
  const sinTable = new Array(numAngleCells);

  for (let theta = 0, thetaIndex = 0; thetaIndex < numAngleCells; theta += Math.PI / numAngleCells, thetaIndex += 1) {
    cosTable[thetaIndex] = Math.cos(theta);
    sinTable[thetaIndex] = Math.sin(theta);
  }

  const relevantMeasurements = measurements.filter(measurement => measurement <= (arenaHeight / 2) * 1.5);
  const points = mapLidarData2Points(relevantMeasurements, arenaHeight);
  console.log({ points });

  const accum = points.reduce(houghAcc.bind(null, arenaHeight, cosTable, sinTable, rhoMax), new Array(numAngleCells));
  console.log({ accum });

  const lines = findLines(30, cosTable, sinTable, rhoMax, accum);
  console.log({ lines });

  const corners = findCorners(lines);
  console.log({ corners });

  // if 0 corners => most likely near the edge of area => ?
  // if 1 corner => most likely very close to a corner => try moving a bit and search again
  // if 2 corners => determine location

  // find angle(s) (between position and corners)
  // console.log(angle)

  // rotate?
  // verify?
};

module.exports = solveStartVectorHough;