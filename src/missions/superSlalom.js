"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
exports.default = () => (logger, config, arena, sensors, actuators, utils, helpers) => {
    const eventEmitter = new events_1.default();
    const { getAngleDistance } = utils.sensor.lidar;
    const { rad2deg, deg2rad, calculateDistance } = utils.robotlib.math;
    const { startPosition, isWithinDistance, verifyRotation } = helpers;
    const { motion } = actuators;
    const { lidar } = sensors;
    const { pause } = utils.robotlib;
    const startOffset = 250;
    const lidarData = {};
    let heading = 0;
    let side = 'left';
    function constructor() {
        lidar.on('data', onLidarData);
    }
    function start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield startPosition(arena.height, startOffset);
            yield findGap();
            yield motion.stop();
            yield moveThroughGap();
            side = 'right';
            yield findGap();
            yield motion.stop();
            yield moveThroughGap();
            side = 'left';
            yield motion.speedHeading(config.MAX_SPEED, heading, isWithinDistance(config.WALL_STOPPING_DISTANCE));
            yield motion.stop();
            yield crossover();
            heading = -Math.PI;
            yield findGap();
            yield motion.stop();
            yield moveThroughGap();
            side = 'right';
            yield findGap();
            yield motion.stop();
            yield moveThroughGap();
            side = 'left';
            yield motion.speedHeading(config.MAX_SPEED, heading, isWithinDistance(config.WALL_STOPPING_DISTANCE));
            yield motion.stop();
            eventEmitter.emit('mission_complete');
        });
    }
    function findGap() {
        const referenceAngle = side === 'left' ? 270 : 90;
        let isAtFirstCan = false;
        let hasCounterStarted = false;
        let startPose;
        return new Promise(resolve => {
            motion.speedHeading(100, heading);
            const interval = setInterval(() => {
                const minDistance = getAngleDistance(lidarData, referenceAngle, 1);
                const maxDistance = getAngleDistance(lidarData, referenceAngle, 1, 'max');
                if (!isAtFirstCan && minDistance < 600) {
                    isAtFirstCan = true;
                }
                if (isAtFirstCan) {
                    if (!hasCounterStarted && maxDistance > 600) {
                        hasCounterStarted = true;
                        startPose = motion.getPose();
                    }
                    if (hasCounterStarted) {
                        const currentPose = motion.getPose();
                        const distanceTravelled = calculateDistance(startPose, currentPose);
                        if (distanceTravelled >= 95) {
                            clearInterval(interval);
                            resolve();
                            return;
                        }
                        if (minDistance < 600) {
                            hasCounterStarted = false;
                        }
                    }
                }
            }, 10);
        });
    }
    function moveThroughGap() {
        return __awaiter(this, void 0, void 0, function* () {
            const crossingDistance = (startOffset * 2);
            const inAngle = (Math.PI / 2) * (side === 'left' ? -1 : 1);
            const outAngle = inAngle * -1;
            const inAngleAbsolute = inAngle < 0 ? 360 - Math.abs(rad2deg(inAngle)) : rad2deg(inAngle);
            const frontCanAngle = side === 'left' ? findFrontCanAngleLeft(inAngleAbsolute) : findFrontCanAngleRight(inAngleAbsolute);
            const angleDiff = frontCanAngle - inAngleAbsolute;
            const angleDiffRad = deg2rad(angleDiff);
            const remainingDistance = Math.abs(Math.sin(angleDiffRad) * lidarData[frontCanAngle]);
            const centerOffsetDistance = -(Math.abs(((240 / 2) - remainingDistance)) * 1.05);
            yield pause(250);
            yield motion.distanceHeading(centerOffsetDistance, heading);
            yield pause(250);
            yield motion.rotate(inAngle);
            yield pause(250);
            yield motion.distanceHeading(crossingDistance, heading + inAngle);
            yield pause(250);
            yield motion.rotate(outAngle);
            yield pause(250);
            return Promise.resolve();
        });
    }
    function findFrontCanAngleLeft(referenceAngle) {
        const frontCanAngle = Object
            .keys(lidarData)
            .map(angle => parseInt(angle, 10))
            .filter(angle => angle > referenceAngle && angle < referenceAngle + 60)
            .find(angle => lidarData[angle] < 600);
        return frontCanAngle;
    }
    function findFrontCanAngleRight(referenceAngle) {
        const reversedLidarData = [...Object.keys(lidarData)].reverse();
        const frontCanAngle = reversedLidarData.map(angle => parseInt(angle, 10))
            .filter(angle => angle < referenceAngle && angle > referenceAngle - 60)
            .find(angle => lidarData[angle] < 600);
        return frontCanAngle;
    }
    function crossover() {
        return __awaiter(this, void 0, void 0, function* () {
            const crossingDistance = (startOffset * 2);
            yield motion.rotate(-Math.PI / 2);
            yield pause(250);
            yield motion.distanceHeading(crossingDistance, -Math.PI / 2);
            yield pause(250);
            yield motion.rotate(-Math.PI / 2);
            yield pause(250);
            yield verifyRotation(90, 60);
            yield pause(250);
            return Promise.resolve();
        });
    }
    function stop() {
        motion.stop(true);
        motion.setTrackPose(false);
        lidar.off('data', onLidarData);
    }
    function onLidarData({ angle, distance }) {
        if (distance) {
            lidarData[Math.round(angle)] = distance;
        }
        else {
            delete lidarData[Math.round(angle)];
        }
    }
    constructor();
    return {
        events: eventEmitter,
        start,
        stop,
    };
};
