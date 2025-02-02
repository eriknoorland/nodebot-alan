export interface IConfigOptions {
  NAME: string
  MOTOR_ENCODER_CPR: number
  MOTOR_GEAR_RATIO: number
  WHEEL_BASE: number
  BASE_WHEEL_DIAMETER: number
  WHEEL_DIAMETER_DIFF_PERCENTAGE: number
  ACCELERATION_STEP: number
  MIN_SPEED: number
  MAX_SPEED: number
  MAX_ROTATION_SPEED: number
  WALL_STOPPING_DISTANCE: number
  HEADING_KP: number
  HEADING_KI: number
  HEADING_KD: number
  GRIPPER_JAW_CLOSE_ANGLE: number
  GRIPPER_JAW_WIDE_OPEN_ANGLE: number
  GRIPPER_JAW_OPEN_ANGLE: number
  GRIPPER_LIFT_UP_ANGLE: number
  GRIPPER_LIFT_DOWN_ANGLE: number
  GRIPPER_OBSTACLE_DISTANCE: number
  GRIPPER_OBSTACLE_PICKUP_DISTANCE: number
  LIDAR_ANGLE_OFFSET: number
  TELEMETRY_PUBLIC_FOLDER: string
  ENABLE_OBSERVATIONS: boolean
  ENABLE_IMU: boolean
  ENABLE_ICP: boolean
}

export interface IConfig extends IConfigOptions {
  LOGS_DIR: string
  LOOP_TIME: number
  NUM_TICKS_PER_REVOLUTION: number
  BASE_CIRCUMFERENCE: number
  LEFT_WHEEL_DIAMETER: number
  LEFT_WHEEL_CIRCUMFERENCE: number
  LEFT_DISTANCE_PER_TICK: number
  RIGHT_WHEEL_DIAMETER: number
  RIGHT_WHEEL_CIRCUMFERENCE: number
  RIGHT_DISTANCE_PER_TICK: number
  ACCELERATION: number
}

const requiredSpecifics = [
  'NAME',
  'MOTOR_ENCODER_CPR',
  'MOTOR_GEAR_RATIO',
  'WHEEL_BASE',
  'BASE_WHEEL_DIAMETER',
  'WHEEL_DIAMETER_DIFF_PERCENTAGE',
  'ACCELERATION_STEP',
  'MIN_SPEED',
  'MAX_SPEED',
  'MAX_ROTATION_SPEED',
  'WALL_STOPPING_DISTANCE',
  'HEADING_KP',
  'HEADING_KI',
  'HEADING_KD',
  'GRIPPER_JAW_CLOSE_ANGLE',
  'GRIPPER_JAW_WIDE_OPEN_ANGLE',
  'GRIPPER_JAW_OPEN_ANGLE',
  'GRIPPER_LIFT_UP_ANGLE',
  'GRIPPER_LIFT_DOWN_ANGLE',
  'GRIPPER_OBSTACLE_DISTANCE',
  'GRIPPER_OBSTACLE_PICKUP_DISTANCE',
  'LIDAR_ANGLE_OFFSET',
  'TELEMETRY_PUBLIC_FOLDER',
];

export const makeConfig = (specifics: IConfigOptions): IConfig => {
  const areSpecificsComplete = requiredSpecifics.every(prop => specifics[prop as keyof IConfigOptions] !== undefined);

  if (!areSpecificsComplete) {
    const missingSpecifics = requiredSpecifics.filter(prop => specifics[prop as keyof IConfigOptions] === undefined);

    throw new Error(`Specifics are not complete, missing: ${missingSpecifics.join(', ')}`);
  }

  const LOGS_DIR = `${__dirname}/../logs`;
  const LOOP_TIME = 20; // ms
  const NUM_TICKS_PER_REVOLUTION = specifics.MOTOR_GEAR_RATIO * specifics.MOTOR_ENCODER_CPR;
  const BASE_CIRCUMFERENCE = Math.PI * specifics.WHEEL_BASE;
  const LEFT_WHEEL_DIAMETER = specifics.BASE_WHEEL_DIAMETER - (specifics.BASE_WHEEL_DIAMETER * specifics.WHEEL_DIAMETER_DIFF_PERCENTAGE / 100); // mm
  const LEFT_WHEEL_CIRCUMFERENCE = Math.PI * LEFT_WHEEL_DIAMETER; // mm
  const LEFT_DISTANCE_PER_TICK = LEFT_WHEEL_CIRCUMFERENCE / NUM_TICKS_PER_REVOLUTION; // mm
  const RIGHT_WHEEL_DIAMETER = specifics.BASE_WHEEL_DIAMETER + (specifics.BASE_WHEEL_DIAMETER * specifics.WHEEL_DIAMETER_DIFF_PERCENTAGE / 100); // mm
  const RIGHT_WHEEL_CIRCUMFERENCE = Math.PI * RIGHT_WHEEL_DIAMETER; // mm
  const RIGHT_DISTANCE_PER_TICK = RIGHT_WHEEL_CIRCUMFERENCE / NUM_TICKS_PER_REVOLUTION; // mm
  const ACCELERATION = specifics.ACCELERATION_STEP * (1000 / LOOP_TIME); // mm/s

  return {
    ...specifics,
    LOGS_DIR,
    LOOP_TIME,
    NUM_TICKS_PER_REVOLUTION,
    BASE_CIRCUMFERENCE,
    LEFT_WHEEL_DIAMETER,
    LEFT_WHEEL_CIRCUMFERENCE,
    LEFT_DISTANCE_PER_TICK,
    RIGHT_WHEEL_DIAMETER,
    RIGHT_WHEEL_CIRCUMFERENCE,
    RIGHT_DISTANCE_PER_TICK,
    ACCELERATION,
  };
};