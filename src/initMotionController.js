const MotionController = require('nodebot-motion-controller');

/**
 * Initialize motion controller
 * @param {String} portName
 * @param {Object} config
 * @param {Object} options
 * @return {Object}
 */
const initMotionController = (portName, config, options = {}) => new Promise((resolve, reject) => {
  if (!portName) {
    reject('motion controller not found');
    return;
  }

  const motion = MotionController(portName, config, options);
  const errorTimeout = setTimeout(() => {
    reject('motion controller timed out');
  }, 5000);

  let isReady = false;

  const isReadyTimeout = setTimeout(() => {
    if (!isReady) {
      motion.isReady()
        .catch(reject);
    }
  }, 1000);

  const onInit = () => {
    isReady = true;
    clearTimeout(isReadyTimeout);
    clearTimeout(errorTimeout);
    resolve(motion);
  };

  motion.init()
    .then(onInit)
    .catch(reject);
});

module.exports = initMotionController;