const backAndForth = require('./backAndForth');
// const slalom = require('./slalom');
const superSlalom = require('./superSlalom2');
const lineFollower = require('./lineFollower');
const tTime = require('./tTime');
const cans = require('./cans');
const remote = require('./remote');
const startVector = require('./testStartVector');
const pickupCan = require('./testPickupCan');
// const umbmark = require('./testUMBMark');

module.exports = [
  { name: 'Heen & Weer', module: backAndForth },
  // { name: 'Slalom', module: slalom },
  { name: 'Super Slalom', module: superSlalom },
  { name: 'Lijnvolgen', module: lineFollower() },
  { name: 'Lijnvolgen met Obstakel', module: lineFollower(true) },
  // { name: 'T-Tijd', module: tTime() },
  { name: 'T-Tijd met smalle doorgang', module: tTime(true) },
  { name: 'Blikken', module: cans() },
  // { name: 'Blikken Retour', module: cans(true) },
  { name: '[Test] Remote', module: remote },
  { name: '[Test] Start Vector', module: startVector },
  { name: '[Test] Blik pakken', module: pickupCan },
  // { name: '[Test] UMBMark', module: umbmark },
];
