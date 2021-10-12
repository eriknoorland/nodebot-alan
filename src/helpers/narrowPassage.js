const robotlib = require('robotlib');

const { deg2rad } = robotlib.utils.math;
const { getShortestDistance } = robotlib.utils.sensor.lidar;

const scanData2Array = (data, acc, a) => {
  const angle = a > 180 ? (360 - a) * -1 : parseInt(a, 10);
  const distance = data[a];

  acc.push({ angle, distance });
  return acc;
};

const getScanRange = (range, angle) => {
  return angle >= (360 - range) || angle <= range;
}

const narrowPassage = async (motion, lidarData) => {
  const measurements = Object.keys(lidarData)
    .filter(getScanRange.bind(null, 50))
    .reduce(scanData2Array.bind(null, lidarData), [])
    .sort((a, b) => a.angle - b.angle);

  const shortestDistance = getShortestDistance(measurements);
  const distanceToObstacleLine = shortestDistance.distance * Math.cos(deg2rad(shortestDistance.angle));
  const obstacleMeasurements = measurements.filter(({ angle, distance }) => {
    const a = angle < 0 ? (360 + angle) : angle;
    const referenceS = distanceToObstacleLine / Math.cos(deg2rad(a));

    return distance < referenceS + 50;
  });

  const gap = { minAngle: 0, maxAngle: 0 };

  for (let i = 1, x = obstacleMeasurements.length; i < x; i += 1) {
    const minAngle = obstacleMeasurements[i - 1].angle;
    const maxAngle = obstacleMeasurements[i].angle;
    const angleDiff = maxAngle - minAngle;

    if (angleDiff > gap.maxAngle - gap.minAngle) {
      gap.maxAngle = maxAngle;
      gap.minAngle = minAngle;
    }
  }

  const gapAngle = Math.round((gap.minAngle + gap.maxAngle) / 2);
  const normalizedGapAngle = (360 + gapAngle) % 360;
  // const sideDistanceOffset = Math.floor(gapAngle / 15) * 25;

  console.log({
    gapAngle,
    normalizedGapAngle,
    // sideDistanceOffset,
  });

  const sideDistance = (distanceToObstacleLine * Math.tan(deg2rad(normalizedGapAngle))); // + sideDistanceOffset;
  const forwardDistance = distanceToObstacleLine - 250;
  const turnAngle = Math.atan(sideDistance / forwardDistance);
  const driveDistance = Math.round((Math.sqrt(Math.pow(forwardDistance, 2) + Math.pow(sideDistance, 2))));

  console.log({
    sideDistance,
    // forwardDistance,
    turnAngle,
    driveDistance,
  });

  // move to gap
  await motion.rotate(turnAngle);
  await motion.distanceHeading(driveDistance, turnAngle);
  await motion.rotate(turnAngle * -1);

  // go trough gap
  // await motion.speedHeading(200 / 2, 0, isWithinDistance(lidar, 250, 0));
  // await motion.stop();

  return Promise.resolve();
};

module.exports = narrowPassage;