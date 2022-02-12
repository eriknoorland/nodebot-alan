require('dotenv').config();

const nodebot = require('../index');

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
};

const expectedDevices = {
  lidar: process.env.USB_PORT_LIDAR,
  imu: process.env.USB_PORT_IMU,
  line: process.env.USB_PORT_LINE_SENSOR,
  gripper: process.env.USB_PORT_GRIPPER,
  motion: process.env.USB_PORT_MOTION,
};

nodebot(config, expectedDevices);
