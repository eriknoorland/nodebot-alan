const backAndForth = require('./backAndForth');
const superSlalom = require('./superSlalom2');
const lineFollower = require('./lineFollower');
const tTime = require('./tTime');
const cans = require('./cans');
const remote = require('./remote');

const testDistance = require('./testDistance');
const testHeading = require('./testHeading');
const testRotation = require('./testRotation');
const testStraightLine = require('./testStraightLine');
const testUMBMark = require('./testUMBMark');
const testStartVector = require('./testStartVector');
const testNarrowPassage = require('./testNarrowPassage');
const testVerifyPosition = require('./testVerifyPosition');
const testPickupCan = require('./testPickupCan');

const testPrograms = [
  { name: '[Test] Remote', module: remote },
  { name: '[Test] Rechtuit 1m', module: testDistance(1000) },
  { name: '[Test] Rechtuit 2m', module: testDistance(2000) },
  { name: '[Test] Rechtuit 3m', module: testDistance(3000) },
  { name: '[Test] Rechtuit 4m', module: testDistance(4000) },
  { name: '[Test] Heading 1m', module: testHeading(1000) },
  { name: '[Test] Heading 2m', module: testHeading(2000) },
  { name: '[Test] Heading 3m', module: testHeading(3000) },
  { name: '[Test] Draai 1x rond CW', module: testRotation(1) },
  { name: '[Test] Draai 5x rond CW', module: testRotation(5) },
  { name: '[Test] Draai 10x rond CW', module: testRotation(10) },
  { name: '[Test] Draai 1x rond CCW', module: testRotation(-1) },
  { name: '[Test] Draai 5x rond CCW', module: testRotation(-5) },
  { name: '[Test] Draai 10x rond CCW', module: testRotation(-10) },
  { name: '[Test] Heen & weer 1m CW', module: testStraightLine(1000) },
  { name: '[Test] Heen & weer 2m CW', module: testStraightLine(2000) },
  { name: '[Test] Heen & weer 3m CW', module: testStraightLine(3000) },
  { name: '[Test] Heen & weer 4m CW', module: testStraightLine(4000) },
  { name: '[Test] Heen & weer 1m CCW', module: testStraightLine(1000, -1) },
  { name: '[Test] Heen & weer 2m CCW', module: testStraightLine(2000, -1) },
  { name: '[Test] Heen & weer 3m CCW', module: testStraightLine(3000, -1) },
  { name: '[Test] Heen & weer 4m CCW', module: testStraightLine(4000, -1) },
  { name: '[Test] UMBMark 1m CW', module: testUMBMark(1000) },
  { name: '[Test] UMBMark 2m CW', module: testUMBMark(2000) },
  { name: '[Test] UMBMark 3m CW', module: testUMBMark(3000) },
  { name: '[Test] UMBMark 4m CW', module: testUMBMark(4000) },
  { name: '[Test] UMBMark 1m CCW', module: testUMBMark(1000, -1) },
  { name: '[Test] UMBMark 2m CCW', module: testUMBMark(2000, -1) },
  { name: '[Test] UMBMark 3m CCW', module: testUMBMark(3000, -1) },
  { name: '[Test] UMBMark 4m CCW', module: testUMBMark(4000, -1) },
  { name: '[Test] Start Vector', module: testStartVector },
  { name: '[Test] Smalle doorgang', module: testNarrowPassage },
  { name: '[Test] Verifieër positie', module: testVerifyPosition },
  { name: '[Test] Blik pakken', module: testPickupCan },
];

module.exports = [
  { name: 'Heen & Weer', module: backAndForth },
  // { name: 'Slalom', module: slalom },
  { name: 'Super Slalom', module: superSlalom },
  { name: 'Lijnvolgen', module: lineFollower() },
  { name: 'Lijnvolgen met Obstakel', module: lineFollower(true) },
  { name: 'T-Tijd', module: tTime() },
  { name: 'T-Tijd met smalle doorgang', module: tTime(true) },
  { name: 'Blikken', module: cans() },
  { name: 'Blikken Retour', module: cans(true) },
  ...testPrograms,
];
