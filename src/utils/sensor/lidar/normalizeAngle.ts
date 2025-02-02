 export default (angle: number): number => {
  switch (true) {
    case angle >= 360: return angle % 360;
    case angle < 0: return angle + 360;
    default: return angle
  }
};
