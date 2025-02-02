import { IConfig } from '../config';
import { Actuators, Sensors } from '../interfaces';
import { Logger } from '../utils/logger';

const makeScan = require('./scan');
const makeStartVector = require('./startVector');
const makeGotoStartPosition = require('./gotoStartPosition');
const makeGetInitialPosition = require('./getInitialPosition');
const makeIsWithinDistance = require('./isWithinDistance');
const makeVerifyRotation = require('./verifyRotation');
const makeVerifyPosition = require('./verifyPosition');
const makeNarrowPassage = require('./narrowPassage');
const makeLocateCan = require('./locateCan');
const makePickupCan = require('./pickupCan');
const makeDropCan = require('./dropCan');
const makeStartPosition = require('./startPosition');

export default (logger: Logger, config: IConfig, sensors: Sensors, actuators: Actuators, utils) => {
  const { lidar } = sensors;
  const { motion, gripper } = actuators;

  const scan = makeScan(logger, utils, lidar);
  const locateCan = makeLocateCan(logger, utils, { scan });
  const verifyRotation = makeVerifyRotation(logger, utils, { scan }, motion);
  const verifyPosition = makeVerifyPosition(logger, utils, { scan }, lidar, motion);
  const pickupCan = makePickupCan(logger, utils, {}, motion, gripper);
  const dropCan = makeDropCan(logger, utils, {}, gripper);
  const startVector = makeStartVector(logger, utils, { scan, verifyRotation }, motion);
  const gotoStartPosition = makeGotoStartPosition(logger, utils, {}, motion);
  const getInitialPosition = makeGetInitialPosition(logger, utils, {});
  const isWithinDistance = makeIsWithinDistance(logger, utils, {}, lidar);
  const narrowPassage = makeNarrowPassage(logger, config, utils, { isWithinDistance }, lidar, motion);
  const startPosition = makeStartPosition(logger, utils, { scan, startVector, verifyRotation, gotoStartPosition, getInitialPosition }, motion);

  return {
    scan,
    locateCan,
    verifyRotation,
    verifyPosition,
    pickupCan,
    dropCan,
    startVector,
    gotoStartPosition,
    getInitialPosition,
    isWithinDistance,
    narrowPassage,
    startPosition,
  };
};