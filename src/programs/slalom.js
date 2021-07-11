module.exports = ({ logger }) => {
  function constructor() {
    logger.log('constructor', 'slalom');
  }

  function start() {

  }

  function stop() {

  }

  constructor();

  return {
    start,
    stop,
  };
};
