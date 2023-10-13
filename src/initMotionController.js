const initMotionController = ({ path, package, options }, config) => new Promise((resolve, reject) => {
  if (!path) {
    reject('motion controller not found');
    return;
  }

  if (!package) {
    reject('no motion package available');
  }

  const motion = package(path, config, options);
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