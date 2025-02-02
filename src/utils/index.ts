import getArenaMatrix from './getArenaMatrix';
import averageMeasurements from './sensor/lidar/averageMeasurements';
import filterMeasurements from './sensor/lidar/filterMeasurements';
import getAngleDistance from './sensor/lidar/getAngleDistance';
import getLongestDistance from './sensor/lidar/getLongestDistance';
import getShortestDistance from './sensor/lidar/getShortestDistance';
import normalizeAngle from './sensor/lidar/normalizeAngle';
import obstacleDetection from './sensor/lidar/obstacleDetection';
import scanObject2Array from './sensor/lidar/scanObject2Array';

export default {
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
  getArenaMatrix,
};