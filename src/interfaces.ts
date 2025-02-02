import { RPLidar } from '@eriknoorland/node-rplidar';
import { YDLidar } from '@eriknoorland/node-ydlidar';
import { Gripper } from '@eriknoorland/nodebot-gripper';
import { Line } from '@eriknoorland/nodebot-line-sensor';
import { IMU } from '@eriknoorland/nodebot-imu';

export interface Sensors {
  odometry: DifferentialDrive
  lidar: RPLidar | YDLidar
  line: Line
  imu: IMU
  observations: Observations
}

export interface Actuators {
  motion: DifferentialDrive
  gripper: Gripper
}