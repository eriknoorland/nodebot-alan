// const backAndForth = require('./backAndForth');
// const slalom = require('./slalom');
// const superSlalom = require('./superSlalom');
const superSlalom2 = require('./superSlalom2');
const lineFollower = require('./lineFollower');
const tTime = require('./tTime');
// const cans = require('./cans');
// const remote = require('./remote');
// const startVector = require('./startVector');
// const umbmark = require('./umbmark');

module.exports = [
  // { name: 'Heen & Weer', module: backAndForth },
  // { name: 'Slalom', module: slalom },
  { name: 'Super Slalom', module: superSlalom2 },
  { name: 'Lijnvolgen', module: lineFollower() },
  // { name: 'Lijnvolgen met Obstakel', module: lineFollower(true) },
  // { name: 'T-Tijd', module: tTime() },
  { name: 'T-Tijd + Bonus', module: tTime(true) },
  // { name: 'Blikken', module: cans() },
  // { name: 'Blikken Retour', module: cans(true) },
  // { name: 'Remote', module: remote },
  // { name: 'Start Vector', module: startVector },
  // { name: 'UMBMark', module: umbmark },
];
