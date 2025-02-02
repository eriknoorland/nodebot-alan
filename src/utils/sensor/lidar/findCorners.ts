const mathjs = require('mathjs');

// FIXME move to robotlib - commit, push, and update robotlib!
const numberInRange = (value: number, min: number, max: number) => value >= min && value <= max;

const findCorners = lines => lines.reduce((acc, line, index, array) => {
  array
    .filter((l, otherIndex) => otherIndex > index)
    .forEach((otherLine) => {
      const intersection = mathjs.intersect(
        [line.x1, line.y1],
        [line.x2, line.y2],
        [otherLine.x1, otherLine.y1],
        [otherLine.x2, otherLine.y2],
      );

      // intersection angle between two lines is ~90deg
      // https://discuss.codechef.com/t/how-to-find-angle-between-two-lines/14516/2
      const angleLine = Math.atan((line.y2 - line.y1) / (line.x2 - line.x1)) * 180 / Math.PI;
      const angleOtherLine = Math.atan((otherLine.y2 - otherLine.y1) / (otherLine.x2 - otherLine.x1)) * 180 / Math.PI;
      const angleDiff = Math.abs(angleLine - angleOtherLine);

      if (intersection && numberInRange(angleDiff, 89, 91)) {
        const newCorner = {
          x: intersection[0],
          y: intersection[1],
        };

        const closeCorner = acc.find(corner => calculateDistance(newCorner, corner) < 20);

        if (!closeCorner) {
          acc.push(newCorner);
        }
      }
    });

  return acc;
}, []);

export default findCorners;
