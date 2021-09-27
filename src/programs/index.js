const backAndForth = require('./backAndForth');
const superSlalom = require('./superSlalom2');
const lineFollower = require('./lineFollower');
const tTime = require('./tTime');
const cans = require('./cans');
const remote = require('./remote');
const rotation = require('./testRotation');
const straightLine = require('./testStraightLine');
const startVector = require('./testStartVector');
const pickupCan = require('./testPickupCan');
const umbmark = require('./testUMBMark');

const testPrograms = [
  { name: '[Test] Remote', module: remote },
  { name: '[Test] Draai 1x rond rechtsom', module: rotation(1) },
  { name: '[Test] Draai 2x rond rechtsom', module: rotation(2) },
  { name: '[Test] Draai 4x rond rechtsom', module: rotation(4) },
  { name: '[Test] Draai 8x rond rechtsom', module: rotation(8) },
  { name: '[Test] Draai 10x rond rechtsom', module: rotation(10) },
  { name: '[Test] Draai 1x rond linksom', module: rotation(-1) },
  { name: '[Test] Draai 2x rond linksom', module: rotation(-2) },
  { name: '[Test] Draai 4x rond linksom', module: rotation(-4) },
  { name: '[Test] Draai 8x rond linksom', module: rotation(-8) },
  { name: '[Test] Draai 10x rond linksom', module: rotation(-10) },
  { name: '[Test] Rechte lijn 1m rechtsom', module: straightLine(1000) },
  { name: '[Test] Rechte lijn 2m rechtsom', module: straightLine(2000) },
  { name: '[Test] Rechte lijn 3m rechtsom', module: straightLine(3000) },
  { name: '[Test] Rechte lijn 4m rechtsom', module: straightLine(4000) },
  { name: '[Test] Rechte lijn 1m linksom', module: straightLine(1000, -1) },
  { name: '[Test] Rechte lijn 2m linksom', module: straightLine(2000, -1) },
  { name: '[Test] Rechte lijn 3m linksom', module: straightLine(3000, -1) },
  { name: '[Test] Rechte lijn 4m linksom', module: straightLine(4000, -1) },
  { name: '[Test] UMBMark 1m rechtsom', module: umbmark(1000) },
  { name: '[Test] UMBMark 2m rechtsom', module: umbmark(2000) },
  { name: '[Test] UMBMark 3m rechtsom', module: umbmark(3000) },
  { name: '[Test] UMBMark 4m rechtsom', module: umbmark(4000) },
  { name: '[Test] UMBMark 1m linksom', module: umbmark(1000, -1) },
  { name: '[Test] UMBMark 2m linksom', module: umbmark(2000, -1) },
  { name: '[Test] UMBMark 3m linksom', module: umbmark(3000, -1) },
  { name: '[Test] UMBMark 4m linksom', module: umbmark(4000, -1) },
  { name: '[Test] Start Vector', module: startVector },
  { name: '[Test] Blik pakken', module: pickupCan },
];

module.exports = [
  { name: 'Heen & Weer', module: backAndForth },
  // { name: 'Slalom', module: slalom },
  { name: 'Super Slalom', module: superSlalom },
  { name: 'Lijnvolgen', module: lineFollower() },
  { name: 'Lijnvolgen met Obstakel', module: lineFollower(true) },
  { name: 'T-Tijd', module: tTime() },
  { name: 'T-Tijd met smalle doorgang', module: tTime(true) },
  // { name: 'Blikken', module: cans() },
  { name: 'Blikken Retour', module: cans(true) },
  ...testPrograms,
];
