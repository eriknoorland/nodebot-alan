module.exports = (pickupAndReturn = false) => ({ config, arena, logger, controllers, sensors }) => {
  function constructor() {
    logger.log('constructor', 'cans');
  }

  function start() {
    logger.log('start', 'cans');

    // solve start vector
    // go to start position (center i guess)
    // track pose and set start position

    // scan for cans in sqaure A (register them on map)
    // pickup in order of closest to farthest

    // drive to center
    // scan for cans in center square (register them on map)
    // pickup in order of closest to farthest

    // drive to center of square B
    // scan for cans in square B (register them on map)
    // pickup in order of closest to farthest

    // drive to center of square C
    // scan for cans in square B (register them on map)
    // pickup in order of closest to farthest

    // drive back to start position
  }

  function stop() {
    logger.log('stop', 'cans');
  }

  function missionComplete() {
    logger.log('mission complete', 'cans');
    stop();
  }

  constructor();

  return {
    start,
    stop,
  };
};