import nodebotUtils from '@eriknoorland/nodebot-utils';
import { Server, Socket } from 'socket.io';

import identifyUSBDevices, { IUSBDevices } from './utils/identifyUSBDevices';
import { makeConfig, IConfigOptions } from './config';
import hardwareController from './hardwareController';
import missionController from './missionController';
import observationsController, { Observation } from './observationsController';
import socketController from './socketController';
import telemetryController from './telemetryController';
import { logger as loggerUtil } from './utils/logger';
import utilities from './utils';
import makeHelpers from './helpers';
import { Actuators, Sensors } from './interfaces';
import missions from './missions';

export default (specifics: IConfigOptions, usbDevices: IUSBDevices) => {
  const config = makeConfig(specifics);
  let telemetry: ReturnType<typeof telemetryController> | null = null;
  let missionControl: ReturnType<typeof missionController> | null = null;

  async function init() {
    console.log('Setup socket server...');
    const io = await socketController(config.TELEMETRY_PUBLIC_FOLDER);

    console.log('Waiting for client to connect...');
    const socket = await socketClient(io);

    console.log('Initialize logging capabilities...');
    const logger = loggerUtil(socket);

    logger.log('Initializing utility functions...');
    const utils = {
      ...utilities,
      robotlib: nodebotUtils,
    };

    logger.log('Identifying connected USB devices...');
    const devices = await identifyUSBDevices(usbDevices);

    logger.log('Setup hardware devices...');
    const { motion, lidar, line, gripper, imu } = await hardwareController(logger, config, devices);

    logger.log('Setup software sensors...');

    let observations = null;
    if (config.ENABLE_OBSERVATIONS) {
      observations = observationsController(utils, motion, lidar);

      observations.on('pose', (observation: Observation) => {
        logger.data(observation, 'observation');
      });
    }

    const sensors: Sensors = { odometry: motion, lidar, line, imu, observations };
    const actuators: Actuators = { motion, gripper };

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

  function onSocketConnection(socket: Socket) {
    if (telemetry) {
      missionControl?.setSocket(socket);
      telemetry.setSocket(socket);
      telemetry.setup();
      telemetry.ready();
    }
  }

  function socketClient(io: Server): Promise<Socket> {
    return new Promise(resolve => {
      io.on('connection', resolve);
    });
  }

  init();
};
