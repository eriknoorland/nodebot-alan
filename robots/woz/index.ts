import MotionController from '@eriknoorland/nodebot-differential-drive';
// import Gripper from '@eriknoorland/nodebot-gripper';
// import IMU from '@eriknoorland/nodebot-imu';
// import LineSensor from '@eriknoorland/nodebot-line-sensor';
import YDLidar from '@eriknoorland/node-ydlidar';

import nodebot from '../../src/app';
import { IConfigOptions } from '../../src/config';
import { IExpectedDevice, IKnownDevice, IUSBDevices } from '../../src/utils/identifyUSBDevices';

require('dotenv').config();

const MAX_SPEED = 300; // mm/s
const config: IConfigOptions = {
  NAME: 'Woz',
  MOTOR_ENCODER_CPR: 64, // two pin encoder rising and falling edge
  MOTOR_GEAR_RATIO: 29,
  WHEEL_BASE: 190.825, // mm
  BASE_WHEEL_DIAMETER: 61.45, // mm
  WHEEL_DIAMETER_DIFF_PERCENTAGE: 0,
  ACCELERATION_STEP: 5,
  MIN_SPEED: 50, // mm/s
  MAX_SPEED: 300, // mm/s
  MAX_ROTATION_SPEED: MAX_SPEED / 2,
  WALL_STOPPING_DISTANCE: MAX_SPEED * 2,
  HEADING_KP: 0,
  HEADING_KI: 0,
  HEADING_KD: 0,
  GRIPPER_JAW_CLOSE_ANGLE: 28, // deg
  GRIPPER_JAW_WIDE_OPEN_ANGLE: 85, // deg
  GRIPPER_JAW_OPEN_ANGLE: 125, // deg
  GRIPPER_LIFT_UP_ANGLE: 75, // deg
  GRIPPER_LIFT_DOWN_ANGLE: 140, // deg
  GRIPPER_OBSTACLE_DISTANCE: 200, // mm
  GRIPPER_OBSTACLE_PICKUP_DISTANCE: 130, // mm
  LIDAR_ANGLE_OFFSET: 0,
  TELEMETRY_PUBLIC_FOLDER: process.env.TELEMETRY_PUBLIC_FOLDER || '',
  ENABLE_OBSERVATIONS: process.env.ENABLE_OBSERVATIONS === 'true',
  ENABLE_IMU: process.env.ENABLE_IMU === 'true',
  ENABLE_ICP: process.env.ENABLE_ICP === 'true',
};

const expectedDevices: IExpectedDevice[] = [
  { id: 'lidar', package: YDLidar, init: () => {} },
  // { id: 'imu', package: IMU, init: () => {} },
  // { id: 'line', package: LineSensor, init: () => {} },
  // { id: 'gripper', package: Gripper, init: () => {} },
  { id: 'motion', package: MotionController, init: () => {} },
];

const knownDevices: IKnownDevice[] = [
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

const usbDevices: IUSBDevices = {
  expectedDevices,
  knownDevices,
  ignoredPorts: [
    '/dev/tty.Bluetooth-Incoming-Port', // macos
    '/dev/ttyAMA0', // raspbian
  ],
};

nodebot(config, usbDevices);
