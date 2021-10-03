const backAndForth = require('./backAndForth');
const superSlalom = require('./superSlalom2');
const lineFollower = require('./lineFollower');
const tTime = require('./tTime');
const cans = require('./cans');
const remote = require('./remote');

const testDistance = require('./testDistance');
const testRotation = require('./testRotation');
const testStraightLine = require('./testStraightLine');
const testUMBMark = require('./testUMBMark');
const testStartVector = require('./testStartVector');
const testVerifyPosition = require('./testVerifyPosition');
const testPickupCan = require('./testPickupCan');

const testPrograms = [
  { name: '[Test] Remote', module: remote },
  { name: '[Test] 1m rijden', module: testDistance(1000) },
  { name: '[Test] 2m rijden', module: testDistance(2000) },
  { name: '[Test] 3m rijden', module: testDistance(3000) },
  { name: '[Test] 4m rijden', module: testDistance(4000) },
  { name: '[Test] Draai 1x rond rechtsom', module: testRotation(1) },
  { name: '[Test] Draai 10x rond rechtsom', module: testRotation(10) },
  { name: '[Test] Draai 1x rond linksom', module: testRotation(-1) },
  { name: '[Test] Draai 10x rond linksom', module: testRotation(-10) },
  { name: '[Test] Rechte lijn 1m rechtsom', module: testStraightLine(1000) },
  { name: '[Test] Rechte lijn 2m rechtsom', module: testStraightLine(2000) },
  { name: '[Test] Rechte lijn 3m rechtsom', module: testStraightLine(3000) },
  { name: '[Test] Rechte lijn 4m rechtsom', module: testStraightLine(4000) },
  { name: '[Test] Rechte lijn 1m linksom', module: testStraightLine(1000, -1) },
  { name: '[Test] Rechte lijn 2m linksom', module: testStraightLine(2000, -1) },
  { name: '[Test] Rechte lijn 3m linksom', module: testStraightLine(3000, -1) },
  { name: '[Test] Rechte lijn 4m linksom', module: testStraightLine(4000, -1) },
  { name: '[Test] UMBMark 1m rechtsom', module: testUMBMark(1000) },
  { name: '[Test] UMBMark 2m rechtsom', module: testUMBMark(2000) },
  { name: '[Test] UMBMark 3m rechtsom', module: testUMBMark(3000) },
  { name: '[Test] UMBMark 4m rechtsom', module: testUMBMark(4000) },
  { name: '[Test] UMBMark 1m linksom', module: testUMBMark(1000, -1) },
  { name: '[Test] UMBMark 2m linksom', module: testUMBMark(2000, -1) },
  { name: '[Test] UMBMark 3m linksom', module: testUMBMark(3000, -1) },
  { name: '[Test] UMBMark 4m linksom', module: testUMBMark(4000, -1) },
  { name: '[Test] Start Vector', module: testStartVector },
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
