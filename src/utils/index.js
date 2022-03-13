// index
const cellStates = require('./cellStates');
const getArenaMatrix = require('./getArenaMatrix');

// sensor/lidar
const averageMeasurements = require('./sensor/lidar/averageMeasurements');
const filterMeasurements = require('./sensor/lidar/filterMeasurements');
const getAngleDistance = require('./sensor/lidar/getAngleDistance');
const getLongestDistance = require('./sensor/lidar/getLongestDistance');
const getShortestDistance = require('./sensor/lidar/getShortestDistance');
const normalizeAngle = require('./sensor/lidar/normalizeAngle');
const obstacleDetection = require('./sensor/lidar/obstacleDetection');
const scanObject2Array = require('./sensor/lidar/scanObject2Array');

module.exports = {
  sensor: {
    lidar: {
      averageMeasurements,
      filterMeasurements,
      getAngleDistance,
      getLongestDistance,
      getShortestDistance,
      normalizeAngle,
      obstacleDetection,
      scanObject2Array,
    },
  },
  cellStates,
  getArenaMatrix,
};