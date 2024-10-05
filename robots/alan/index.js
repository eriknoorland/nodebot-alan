require('dotenv').config();

const RPLidar = require('@eriknoorland/node-rplidar');
const LineSensor = require('@eriknoorland/nodebot-line-sensor');
const Gripper = require('@eriknoorland/nodebot-gripper');
const IMU = require('@eriknoorland/nodebot-imu');
const MotionController = require('@eriknoorland/nodebot-differential-drive');
const initLidar = require('../../src/initLidar');
const initIMU = require('../../src/initIMU');
const initGripper = require('../../src/initGripper');
const initLineSensor = require('../../src/initLineSensor');
const initMotionController = require('../../src/initMotionController');
const nodebot = require('../../index');

const MAX_SPEED = 300; // mm/s
const config = {
  NAME: 'Alan',
  MOTOR_ENCODER_CPR: 48, // two pin encoder rising and falling edge
  MOTOR_GEAR_RATIO: 46.85,
  WHEEL_BASE: 190.825, // mm
  BASE_WHEEL_DIAMETER: 71.45, // mm
  WHEEL_DIAMETER_DIFF_PERCENTAGE: 0.06298110567,
  ACCELERATION_STEP: 5, // mm/looptime
  MIN_SPEED: 50, // mm/s
  MAX_SPEED: 300, // mm/s
  MAX_ROTATION_SPEED: MAX_SPEED / 2,
  WALL_STOPPING_DISTANCE: MAX_SPEED * 2,
  HEADING_KP: 22.5,
  HEADING_KI: 0.45,
  HEADING_KD: 0,
  GRIPPER_JAW_CLOSE_ANGLE: 28,
  GRIPPER_JAW_WIDE_OPEN_ANGLE: 85,
  GRIPPER_JAW_OPEN_ANGLE: 125, // deg
  GRIPPER_LIFT_UP_ANGLE: 75, // deg
  GRIPPER_LIFT_DOWN_ANGLE: 140, // deg
  GRIPPER_OBSTACLE_DISTANCE: 200, // mm
  GRIPPER_OBSTACLE_PICKUP_DISTANCE: 130, // mm
  LIDAR_ANGLE_OFFSET: 0, // -2.0987292108330338
  TELEMETRY_PUBLIC_FOLDER: process.env.TELEMETRY_PUBLIC_FOLDER,
  ENABLE_OBSERVATIONS: process.env.ENABLE_OBSERVATIONS === 'true',
  ENABLE_IMU: process.env.ENABLE_IMU === 'true',
  ENABLE_ICP: process.env.ENABLE_ICP === 'true',
};

const expectedDevices = [
  {
    id: 'lidar',
    package: RPLidar,
    init: initLidar,
  },
  {
    id: 'imu',
    package: IMU,
    init: initIMU,
  },
  {
    id: 'line',
    package: LineSensor,
    init: initLineSensor,
  },
  {
    id: 'gripper',
    package: Gripper,
    init: initGripper,
  },
  {
    id: 'motion',
    package: MotionController,
    init: initMotionController,
    options: {
      useIMU: config.ENABLE_IMU,
    },
  },
];

const knownDevices = [
  {
    id: 'lidar',
    manufacturer: 'Silicon Labs',
    vendorId: '10c4',
    productId: 'ea60',
  },
  {
    id: 'motion',
    manufacturer: 'Teensyduino',
    vendorId: '16c0',
    productId: '0483',
  },
  {
    id: 'imu',
    manufacturer: 'Seeed',
    vendorId: '2886',
    productId: '802f',
  },
];

const usbDevices = {
  expectedDevices,
  knownDevices,
  ignoredPorts: [
    '/dev/tty.Bluetooth-Incoming-Port', // macos
    '/dev/ttyAMA0', // raspbian
  ],
};

nodebot(config, usbDevices);
