module.exports = (socket, logger, config, sensors, actuators, utils, helpers, missions) => {
  const arena = {
    width: 3564,
    height: 2364,
  };

  let currentMission = null;

  function constructor() {
    bindEvents();
  }

  function setSocket(s) {
    socket = s;
    bindEvents();
  }

  function bindEvents() {
    socket.on('start', startMission);
    socket.on('stop', stopMission);
    socket.on('emergencyStop', onEmergencyStop);
  }

  function startMission(missionIndex) {
    if (missionIndex === null) {
      logger.warn('No mission selected');
      return;
    }

    const selectedMission = missions[missionIndex];

    logger.log(`Mission start - ${selectedMission.name}`);
    logger.create(selectedMission.name);

    currentMission = selectedMission.module(logger, config, arena, sensors, actuators, utils, helpers, socket);
    currentMission.events.once('mission_complete', missionComplete);
    currentMission.start();
  }

  function missionComplete() {
    logger.log('Mission complete');
    stopMission();
  }

  function stopMission() {
    logger.log('Mission stop');

    currentMission.stop();
    currentMission = null;

    logger.save(config.LOGS_DIR);
  }

  function onEmergencyStop() {
    stopMission();

    if (actuators.motion) {
      actuators.motion.emergencyStop();
    }

    logger.warn('Emergency stop!');
  }

  constructor();

  return {
    setSocket,
  };
}
