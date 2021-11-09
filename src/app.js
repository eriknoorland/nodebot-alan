require('dotenv').config();

const shell = require('shelljs');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const robotlib = require('robotlib');

const config = require('./config');
const utils = require('./utils');
const programs = require('./programs');
const telemetry = require('./telemetry');

// usb devices
const initLidar = require('./initLidar');
const initGripper = require('./initGripper');
const initLineSensor = require('./initLineSensor');
const initMotionController = require('./initMotionController');

// helpers
const makeScan = require('./helpers/scan');
const makeStartVector = require('./helpers/startVector');
const makeGotoStartPosition = require('./helpers/gotoStartPosition');
const makeGetInitialPosition = require('./helpers/getInitialPosition');
const makeIsWithinDistance = require('./helpers/isWithinDistance');
const makeVerifyRotation = require('./helpers/verifyRotation');
const makeVerifyPosition = require('./helpers/verifyPosition');
const makeNarrowPassage = require('./helpers/narrowPassage');
const makeLocateCan = require('./helpers/locateCan');
const makePickupCan = require('./helpers/pickupCan');
const makeDropCan = require('./helpers/dropCan');
const makeStartPosition = require('./helpers/startPosition');

const utilities = {
  robotlib: robotlib.utils,
  ...utils,
};

const socketOptions = {
  allowEIO3: true,
  cors: {
    origin: '*',
  },
};

const expectedUSBDevices = {
  lidar: process.env.USB_PORT_LIDAR,
  gripper: process.env.USB_PORT_GRIPPER,
  lineSensor: process.env.USB_PORT_LINE_SENSOR,
  motion: process.env.USB_PORT_MOTION,
};

const app = express();
const httpServer = http.createServer(app);
const io = socketio(httpServer, socketOptions);
const logger = robotlib.utils.logger(io);
const defaultProgramOptions = {
  io,
  config,
  logger,
  utils: utilities,
  helpers: {},
  controllers: {},
  sensors: {},
};

let currentProgram;

app.use(express.static(process.env.TELEMETRY_PUBLIC_FOLDER));

const init = () => {
  logger.log('initialize');
  logger.log('server started', 'telemetry', 'green');

  initUSBDevices(expectedUSBDevices)
    .then(initTelemetry)
    .then(updateProgramOptions);
};

const onSocketDisconnect = () => {
  logger.log('client disconnected', 'telemetry', 'yellow');
};

const onSocketConnection = socket => {
  logger.log('client connected', 'telemetry', 'green');

  socket.on('disconnect', onSocketDisconnect);
  socket.on('start', onStart.bind(null, socket));
  socket.on('restart', onRestart);
  socket.on('stop', onStop);
  socket.on('reboot', onReboot);
  socket.on('shutdown', onShutdown);
  socket.on('emergencyStop', onEmergencyStop);
  socket.on('selected_arena', selectedArena => {
    logger.log(`arena selected - ${selectedArena.name}`, 'app');
    defaultProgramOptions.arena = selectedArena;
  });

  socket.emit('setup', {
    programs: programs,
    sensors: ['lidar', 'odometry', 'poses', 'line', 'battery'],
    name: 'Alan',
  });
};

const onStart = (socket, programIndex) => {
  if (programIndex === null) {
    logger.log('No state selected', 'error', 'red');
    return;
  }

  const selectedProgram = programs[programIndex];

  logger.log(`start "${selectedProgram.name}" state`);

  currentProgram = selectedProgram.module({ ...defaultProgramOptions, socket });
  currentProgram.start();
}

const onStop = async () => {
  logger.log('stop');

  await exitHandler();

  shell.exec(`kill -9 ${process.pid}`);
};

const onRestart = async () => {
  logger.log('restart');

  await exitHandler();

  shell.exec(`kill -9 ${process.pid} && npm start`);
};

const onReboot = async () => {
  logger.log('reboot', 'app', 'red');

  await exitHandler();

  shell.exec('sudo reboot');
};

const onShutdown = async () => {
  logger.log('shutdown', 'app', 'red');

  await exitHandler();

  shell.exec('sudo shutdown -h now');
};

const onEmergencyStop = () => {
  logger.log('emergency stop!', 'app', 'red');

  if (defaultProgramOptions.controllers.motion) {
    defaultProgramOptions.controllers.motion.emergencyStop();
  }
};

const initUSBDevices = async ({ lidar, gripper, lineSensor, motion }) => {
  const usbDevices = {};

  logger.log('start initializing usb devices...');

  try {
    usbDevices.lidar = await initLidar(lidar, config);
    logger.log(`lidar initialized!`, 'app', 'cyan');
  } catch(error) {
    logger.log(error, 'app', 'red');
  }

  try {
    usbDevices.gripper = await initGripper(gripper, config);
    logger.log(`gripper initialized!`, 'app', 'cyan');
  } catch(error) {
    logger.log(error, 'app', 'red');
  }

  try {
    usbDevices.lineSensor = await initLineSensor(lineSensor);
    logger.log(`line sensor initialized!`, 'app', 'cyan');
  } catch(error) {
    logger.log(error, 'app', 'red');
  }

  try {
    usbDevices.motion = await initMotionController(motion, config);
    logger.log(`motion controller initialized!`, 'app', 'cyan');
  } catch(error) {
    logger.log(error, 'app', 'red');
  }

  return Promise.resolve(usbDevices);
};

const initTelemetry = usbDevices => {
  logger.log('initialize telemetry');

  telemetry(io, config, usbDevices);

  return Promise.resolve(usbDevices);
};

const updateProgramOptions = ({ motion, gripper, lidar, lineSensor }) => {
  logger.log('update state options');

  defaultProgramOptions.controllers.motion = motion;
  defaultProgramOptions.controllers.gripper = gripper;
  defaultProgramOptions.sensors.lidar = lidar;
  defaultProgramOptions.sensors.line = lineSensor;

  const scan = makeScan(utilities, lidar);
  const locateCan = makeLocateCan(utilities, { scan });
  const verifyRotation = makeVerifyRotation(utilities, { scan }, motion);
  const verifyPosition = makeVerifyPosition(utilities, { scan }, lidar, motion);
  const pickupCan = makePickupCan(utilities, {}, motion, gripper);
  const dropCan = makeDropCan(utilities, {}, gripper);
  const startVector = makeStartVector(utilities, { scan, verifyRotation }, motion);
  const gotoStartPosition = makeGotoStartPosition(utilities, {}, motion);
  const getInitialPosition = makeGetInitialPosition(utilities, {});
  const isWithinDistance = makeIsWithinDistance(utilities, {}, lidar);
  const narrowPassage = makeNarrowPassage(utilities, { isWithinDistance }, lidar, motion);
  const startPosition = makeStartPosition(utilities, { scan, startVector, gotoStartPosition, getInitialPosition }, motion);

  defaultProgramOptions.helpers = {
    scan,
    locateCan,
    verifyRotation,
    verifyPosition,
    pickupCan,
    dropCan,
    startVector,
    gotoStartPosition,
    getInitialPosition,
    startPosition,
    isWithinDistance,
    narrowPassage,
  };

  return Promise.resolve();
};

const exitHandler = async () => {
  logger.log('clean up before exit');

  if (currentProgram) {
    currentProgram.stop();
    currentProgram = null;
  }

  const { controllers, sensors } = defaultProgramOptions;

  controllers.gripper && await controllers.gripper.close();
  controllers.motion && await controllers.motion.close();
  sensors.lidar && await sensors.lidar.close();
  sensors.line && await sensors.line.close();

  logger.log('done cleaning up');
};

io.on('connection', onSocketConnection);
httpServer.listen(3000, init);
