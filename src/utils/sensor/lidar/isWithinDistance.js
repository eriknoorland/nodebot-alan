/**
 * Returns a function that returns whether the distance for the given angle is lower or equal then the given allowed distance
 * @param {Object} lidar
 * @param {Number} allowedDistance
 * @param {Number} checkAngle
 */
const isWithinDistance = (lidar, allowedDistance, checkAngle) => {
  let targetDistanceReached = false;
  let count = 0;

  const onLidarData = ({ quality, angle, distance }) => {
    if (quality > 10 && Math.floor(angle) === checkAngle) {
      if (distance > 0 && distance <= allowedDistance) {
        count += 1;

        if (count % 2 === 0) {
          targetDistanceReached = true;
        }
      }
    }
  };

  lidar.on('data', onLidarData);

  return () => targetDistanceReached;
};

module.exports = isWithinDistance;
