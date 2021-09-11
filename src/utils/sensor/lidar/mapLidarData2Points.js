const robotlib = require('robotlib');

const mapLidarData2Points = (data, arenaHeight) => {
  const points = Object
    .keys(data)
    .map(angle => {
      const distance = data[angle];
      const distanceInCm = distance / 10;
      const angleInRadians = robotlib.Math.deg2rad(parseInt(angle, 10));
      const x = (arenaHeight / 2) + (Math.cos(angleInRadians) * distanceInCm);
      const y = (arenaHeight / 2) + (Math.sin(angleInRadians) * distanceInCm);

      return { x, y };
    });

    return points;
};

module.exports = mapLidarData2Points;