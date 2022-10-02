const initLineSensor = ({ path, package }) => new Promise((resolve, reject) => {
  if (!path) {
    reject('line sensor not found');
    return;
  }

  if (!package) {
    reject('no line sensor package available');
  }

  const lineSensor = package(path);
  const errorTimeout = setTimeout(() => {
    reject('line sensor timed out');
  }, 5000);

  let isReady = false;

  const isReadyTimeout = setTimeout(() => {
    if (!isReady) {
      lineSensor.isReady()
        .catch(reject);
    }
  }, 2500);

  const onInit = () => {
    isReady = true;
    clearTimeout(isReadyTimeout);
    clearTimeout(errorTimeout);
    resolve(lineSensor);
  };

  lineSensor.init()
    .then(onInit)
    .catch(reject);
});

module.exports = initLineSensor;