require('dotenv').config();

const robotlib = require('robotlib');
const icpjs = require('icpjs/dist/icpjs.min.js');
const makeConfig = require('./config');
const identifyUSBDevices = require('./utils/identifyUSBDevices');
const socketController = require('./socketController');
const hardwareController = require('./hardwareController');
const observationsController = require('./observationsController');
const icpController = require('./icpController');
const telemetryController = require('./telemetryController');
const missionController = require('./missionController');
const utilities = require('./utils');
const makeHelpers = require('./helpers');
const missions = require('./programs');
const icpReference = require('../data/roboramaLineSegments.json');

module.exports = (specifics, usbDevices) => {
  const config = makeConfig(specifics);
  let telemetry = null;
  let missionControl = null;

  async function init() {
    console.log('Setup socket server...');
    const io = await socketController(config.TELEMETRY_PUBLIC_FOLDER);

    console.log('Waiting for client to connect...');
    const socket = await socketClient(io);

    console.log('Initialize logging capabilities...');
    const logger = robotlib.utils.logger(socket);

    logger.log('Initializing utility functions...');
    const utils = {
      ...utilities,
      robotlib: robotlib.utils,
    };

    logger.log('Identifying connected USB devices...');
    const devices = await identifyUSBDevices(usbDevices);

    logger.log('Setup hardware devices...');
    const { motion, lidar, line, gripper, imu } = await hardwareController(logger, config, devices);

    logger.log('Setup software sensors...');
    const icp = icpController(icpjs, utils, motion, lidar, icpReference, {
      method: icpjs.methods.POINT_TO_PLANE,
      tolerance: 5,
    });

    const observations = observationsController(utils, motion, lidar);
    const sensors = { odometry: motion, lidar, line, imu, icp, observations };
    const actuators = { motion, gripper };

    observations.on('pose', observation => {
      logger.data(observation, 'observation');
    });

    logger.log('Configuring telemetry...');
    telemetry = telemetryController(socket, config, sensors, missions);

    logger.log('Prepare helper functions...');
    const helpers = makeHelpers(logger, config, sensors, actuators, utils);

    logger.log('Setup mission controller...');
    missionControl = missionController(socket, logger, config, sensors, actuators, utils, helpers, missions);

    telemetry.ready();
    logger.success('Ready to go!');

    io.on('connection', onSocketConnection);
  }

  function onSocketConnection(socket) {
    if (telemetry) {
      missionControl.setSocket(socket);
      telemetry.setSocket(socket);
      telemetry.setup();
      telemetry.ready();
    }
  }

  function socketClient(io) {
    return new Promise(resolve => {
      io.on('connection', socket => {
        resolve(socket);
      });
    });
  }

  init();
};
