require('dotenv').config();

const RPLidar = require('node-rplidar');
const LineSensor = require('line-sensor');
const Gripper = require('node-gripper');
const IMU = require('node-imu');
const MotionController = require('nodebot-motion-controller');
const nodebot = require('../../index');

const NAME = 'Alan';
const MOTOR_ENCODER_CPR = 48; // two pin encoder rising and falling edge
const MOTOR_GEAR_RATIO = 46.85;
const WHEEL_BASE = 190.825; // mm
const BASE_WHEEL_DIAMETER = 71.45;
const WHEEL_DIAMETER_DIFF_PERCENTAGE = 0.06298110567; // %
const ACCELERATION_STEP = 5; // mm/looptime
const MIN_SPEED = 50; // mm/s
const MAX_SPEED = 300; // mm/s
const MAX_ROTATION_SPEED = MAX_SPEED / 2; // mm/s
const WALL_STOPPING_DISTANCE = MAX_SPEED * 2; // mm
const HEADING_KP = 22.5;
const HEADING_KI = 0.45;
const HEADING_KD = 0;
const GRIPPER_JAW_CLOSE_ANGLE = 28; // deg
const GRIPPER_JAW_WIDE_OPEN_ANGLE = 85; // deg
const GRIPPER_JAW_OPEN_ANGLE = 125; // deg
const GRIPPER_LIFT_UP_ANGLE = 75; // deg
const GRIPPER_LIFT_DOWN_ANGLE = 140; // deg
const GRIPPER_OBSTACLE_DISTANCE = 200; // mm
const GRIPPER_OBSTACLE_PICKUP_DISTANCE = 130; // mm
const LIDAR_ANGLE_OFFSET = 0; // -2.0987292108330338;

const config = {
  NAME,
  MOTOR_ENCODER_CPR,
  MOTOR_GEAR_RATIO,
  WHEEL_BASE,
  BASE_WHEEL_DIAMETER,
  WHEEL_DIAMETER_DIFF_PERCENTAGE,
  ACCELERATION_STEP,
  MIN_SPEED,
  MAX_SPEED,
  MAX_ROTATION_SPEED,
  WALL_STOPPING_DISTANCE,
  HEADING_KP,
  HEADING_KI,
  HEADING_KD,
  GRIPPER_JAW_CLOSE_ANGLE,
  GRIPPER_JAW_WIDE_OPEN_ANGLE,
  GRIPPER_JAW_OPEN_ANGLE,
  GRIPPER_LIFT_UP_ANGLE,
  GRIPPER_LIFT_DOWN_ANGLE,
  GRIPPER_OBSTACLE_DISTANCE,
  GRIPPER_OBSTACLE_PICKUP_DISTANCE,
  LIDAR_ANGLE_OFFSET,
  TELEMETRY_PUBLIC_FOLDER: process.env.TELEMETRY_PUBLIC_FOLDER,
  ENABLE_OBSERVATIONS: process.env.ENABLE_OBSERVATIONS,
  ENABLE_ICP: process.env.ENABLE_ICP,
};

const expectedDevices = [
  { id: 'lidar', package: RPLidar },
  { id: 'imu', package: IMU },
  { id: 'line', package: LineSensor },
  { id: 'gripper', package: Gripper},
  { id: 'motion', package: MotionController },
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
  // {
  //   id: 'imu',
  //   manufacturer: 'Seeed',
  //   vendorId: '2886',
  //   productId: '802f',
  // },
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
