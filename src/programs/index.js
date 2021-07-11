const remote = require('./remote');
// const umbmark = require('./umbmark');
const backAndForth = require('./backAndForth');
// const slalom = require('./slalom');
// const superSlalom = require('./superSlalom');
const lineFollower = require('./lineFollower');
// const lineFollowerObstacle = require('./lineFollowerObstacle');
// const tTime = require('./tTime');
// const tTimeBonus = require('./tTimeBonus');
// const cans = require('./cans');
// const cansPickupAndReturn = require('./cansPickupAndReturn');

module.exports = [
  {
    name: 'Remote',
    module: remote,
  },
  // {
  //   name: 'UMBMark',
  //   module: umbmark,
  // },
  {
    name: 'Heen & Weer',
    module: backAndForth,
  },
  // {
  //   name: 'Slalom',
  //   module: slalom,
  // },
  // {
  //   name: 'Super Slalom',
  //   module: superSlalom,
  // },
  {
    name: 'Lijnvolgen',
    module: lineFollower,
  },
  // {
  //   name: 'Lijnvolgen met Obstakel',
  //   module: lineFollowerObstacle,
  // },
  // {
  //   name: 'T-Tijd',
  //   module: tTime,
  // },
  // {
  //   name: 'T-Tijd + Bonus',
  //   module: tTimeBonus,
  // },
  // {
  //   name: 'Blikken',
  //   module: cans,
  // },
  // {
  //   name: 'Blikken Retour',
  //   module: cansPickupAndReturn,
  // },
];
