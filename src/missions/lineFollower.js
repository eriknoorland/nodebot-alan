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
exports.default = (withObstacle = false) => (logger, config, arena, sensors, actuators, utils, helpers) => {
    const eventEmitter = new events_1.default();
    const STATE_IDLE = 'idle';
    const STATE_CALIBRATION = 'calibration';
    const STATE_LINE_FOLLOWING = 'lineFollowing';
    const STATE_OBSTACLE_AVOIDANCE = 'obstacleAvoidance';
    const STATE_REDISCOVER_LINE = 'rediscoverLine';
    const STATE_ROTATE_TO_LINE = 'rotateToLine';
    const STATE_DONE = 'done';
    const { averageMeasurements, filterMeasurements } = utils.sensor.lidar;
    const { scan, getInitialPosition } = helpers;
    const { motion } = actuators;
    const { lidar, line: lineSensor } = sensors;
    const { constrain } = utils.robotlib;
    const { deg2rad } = utils.robotlib.math;
    const { getAngleDistance, getShortestDistance, scanObject2Array } = utils.sensor.lidar;
    const calibrationData = [];
    const stopArea = arena.width / 6;
    const maxSpeed = 400;
    const slowSpeed = maxSpeed / 2;
    const Kp = 40;
    let speed = maxSpeed - 100;
    let lastError = 0;
    let numTimesBelowThreshold = 0;
    let state = STATE_IDLE;
    let obstacleDetected = false;
    let isObstacleAvoiding = false;
    let hasRediscoveredLine = false;
    let passObstancleOnLeftSide;
    let minValue;
    let maxValue;
    let meanValue;
    function start() {
        lidar.on('data', onLidarData);
        lineSensor.on('data', onLineData);
        setTimeout(calibrate, 1000);
    }
    function stop() {
        state = STATE_DONE;
        lidar.off('data', onLidarData);
        lineSensor.off('data', onLineData);
        motion.stop();
        motion.setTrackPose(false);
    }
    function calibrate() {
        return __awaiter(this, void 0, void 0, function* () {
            const rotationOffset = 20;
            const startPositionAveragedMeasurements = averageMeasurements(yield scan(1000));
            const { x, y } = getInitialPosition(startPositionAveragedMeasurements, arena.height);
            state = STATE_CALIBRATION;
            motion.setTrackPose(true);
            motion.appendPose({ x, y, phi: 0 });
            yield motion.rotate(deg2rad(-rotationOffset));
            yield motion.rotate(deg2rad(rotationOffset * 2));
            yield motion.rotate(deg2rad(-rotationOffset));
            minValue = Math.min(...calibrationData);
            maxValue = Math.max(...calibrationData);
            meanValue = (minValue + maxValue) / 2;
            if (withObstacle) {
                const leftDistance = getAngleDistance(startPositionAveragedMeasurements, 270);
                const rightDistance = getAngleDistance(startPositionAveragedMeasurements, 90);
                passObstancleOnLeftSide = rightDistance > leftDistance;
            }
            state = STATE_LINE_FOLLOWING;
        });
    }
    function lineFollowing(data) {
        const currentPose = motion.getPose();
        const inStopArea = currentPose.x < stopArea;
        if (inStopArea) {
            if (speed > slowSpeed) {
                speed -= 10;
            }
            if (data.every(value => value < meanValue)) {
                return ++numTimesBelowThreshold <= 20;
            }
        }
        const maxValue = Math.max(...data.filter(value => value > meanValue));
        const index = data.indexOf(maxValue);
        const error = index !== -1 ? index - 3.5 : lastError;
        const leftSpeed = constrain(Math.round(speed + (error * Kp)), 0, maxSpeed);
        const rightSpeed = constrain(Math.round(speed - (error * Kp)), 0, maxSpeed);
        motion.speedLeftRight(leftSpeed, rightSpeed);
        numTimesBelowThreshold = 0;
        lastError = error;
        return true;
    }
    function obstacleAvoiding() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isObstacleAvoiding) {
                isObstacleAvoiding = true;
                const rotationDirection = passObstancleOnLeftSide ? -1 : 1;
                const averagedCanDistanceMeasurements = averageMeasurements(yield scan(1000));
                const filteredCanDistanceMeasurements = filterMeasurements(averagedCanDistanceMeasurements, a => a > 300 || a < 60);
                let canAngle = getShortestDistance(scanObject2Array(filteredCanDistanceMeasurements)).angle;
                if (canAngle > 180) {
                    canAngle = 360 - canAngle;
                }
                const rotationAngle = 45 + canAngle;
                const rotationAngleRad = deg2rad(rotationAngle);
                yield motion.rotate(rotationAngleRad * rotationDirection);
                const heading = motion.getPose().phi;
                yield motion.distanceHeading(200, heading);
                state = STATE_REDISCOVER_LINE;
            }
        });
    }
    function rediscoverLine(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!hasRediscoveredLine) {
                if (data.every(value => value < meanValue)) {
                    const speedDiff = 150;
                    const outerWheelSpeed = 230;
                    const innerWheelSpeed = outerWheelSpeed - speedDiff;
                    const leftSpeed = passObstancleOnLeftSide ? outerWheelSpeed : innerWheelSpeed;
                    const rightSpeed = passObstancleOnLeftSide ? innerWheelSpeed : outerWheelSpeed;
                    motion.speedLeftRight(leftSpeed, rightSpeed);
                    return;
                }
                hasRediscoveredLine = true;
                yield motion.stop();
                state = STATE_ROTATE_TO_LINE;
            }
        });
    }
    function rotateToLine(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const maxValue = Math.max(...data.filter(value => value > meanValue));
            const index = data.indexOf(maxValue);
            const isRoughlyCenteredOnLine = index > 2 && index < 5;
            if (!isRoughlyCenteredOnLine) {
                const leftSpeed = config.MIN_SPEED * (passObstancleOnLeftSide ? -1 : 1);
                const rightSpeed = leftSpeed * -1;
                motion.speedLeftRight(leftSpeed, rightSpeed);
                return;
            }
            yield motion.stop(true);
            state = STATE_LINE_FOLLOWING;
        });
    }
    function onLidarData(_a) {
        return __awaiter(this, arguments, void 0, function* ({ angle, distance }) {
            if (withObstacle && state === STATE_LINE_FOLLOWING) {
                if (!distance) {
                    return;
                }
                const inAngleRange = angle > 300 || angle < 60;
                const obstancleInSight = distance < 250;
                if (!obstacleDetected && inAngleRange && obstancleInSight) {
                    obstacleDetected = true;
                    yield motion.stop(true);
                    state = STATE_OBSTACLE_AVOIDANCE;
                }
            }
        });
    }
    function onLineData(data) {
        if (state === STATE_CALIBRATION) {
            calibrationData.push(...data);
            return;
        }
        if (state === STATE_LINE_FOLLOWING) {
            if (!lineFollowing(data)) {
                eventEmitter.emit('mission_complete');
            }
        }
        if (withObstacle) {
            if (state === STATE_OBSTACLE_AVOIDANCE) {
                obstacleAvoiding(data);
            }
            if (state === STATE_REDISCOVER_LINE) {
                rediscoverLine(data);
            }
            if (state === STATE_ROTATE_TO_LINE) {
                rotateToLine(data);
            }
        }
    }
    return {
        events: eventEmitter,
        start,
        stop,
    };
};
