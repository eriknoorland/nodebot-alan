require('dotenv').config();

const shell = require('shelljs');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const robotlib = require('robotlib');

const config = require('./config');
const programs = require('./programs');
const telemetry = require('./telemetry');
const initLidar = require('./initLidar');
const initGripper = require('./initGripper');
const initLineSensor = require('./initLineSensor');
const initMotionController = require('./initMotionController');

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

  process.exit();
};

const onRestart = async () => {
  logger.log('restart');

  await exitHandler();

  shell.exec(`kill -9 ${process.pid} && npm start`);
};

const onReboot = () => {
  logger.log('reboot', 'app', 'red');
  shell.exec('sudo reboot');
};

const onShutdown = () => {
  logger.log('shutdown', 'app', 'red');
  shell.exec('sudo shutdown -h now');
};

const initUSBDevices = async ({ lidar, gripper, lineSensor, motion }) => {
  const usbDevices = {};

  logger.log('start initializing usb devices...');

  try {
    usbDevices.lidar = await initLidar(lidar);
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

const updateProgramOptions = usbDevices => {
  logger.log('update state options');

  defaultProgramOptions.controllers.motion = usbDevices.motion;
  defaultProgramOptions.controllers.gripper = usbDevices.gripper;
  defaultProgramOptions.sensors.lidar = usbDevices.lidar;
  defaultProgramOptions.sensors.line = usbDevices.lineSensor;

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
