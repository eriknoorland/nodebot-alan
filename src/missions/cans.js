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
exports.default = (pickupAndReturn = false) => (logger, config, arena, sensors, actuators, utils, helpers) => {
    const eventEmitter = new events_1.default();
    const { getArenaMatrix, cellStates } = utils;
    const { averageMeasurements, filterMeasurements, obstacleDetection } = utils.sensor.lidar;
    const { scan, verifyRotation, verifyPosition, locateCan, pickupCan, dropCan, startPosition } = helpers;
    const { icp } = sensors;
    const { motion, gripper } = actuators;
    const { pause } = utils.robotlib;
    const { calculateDistance } = utils.robotlib.math;
    const matrix = getArenaMatrix(arena.width, arena.height, 30);
    const halfArenaHeight = arena.height / 2;
    const maxNumCans = 6;
    const canStoreCoordinates = [
        { x: 100, y: 200 + halfArenaHeight },
        { x: 100, y: 300 + halfArenaHeight },
        { x: 250, y: 200 + halfArenaHeight },
        { x: 250, y: 300 + halfArenaHeight },
        { x: 400, y: 200 + halfArenaHeight },
        { x: 400, y: 300 + halfArenaHeight },
    ];
    const endPosition = {
        x: 200,
        y: arena.height * 0.75,
    };
    const arenaCenterPosition = {
        x: arena.width / 2,
        y: arena.height * 0.75,
    };
    let numStoredCans = 0;
    function start() {
        return __awaiter(this, void 0, void 0, function* () {
            const initialPose = yield startPosition(arena.height);
            const initialPosition = Object.assign({}, initialPose);
            if (initialPosition.x < 450) {
                initialPosition.x = 450;
            }
            const verificationPosition = Object.assign(Object.assign({}, initialPosition), { y: initialPosition.y + 150 });
            const scanRadius = arena.width / 4;
            const scanPositions = [
                Object.assign(Object.assign({}, initialPosition), { heading: 0 }),
                { x: 850, y: initialPosition.y, heading: 0 },
                { x: 1250, y: initialPosition.y, heading: 0 },
                { x: 1650, y: initialPosition.y, heading: 0 },
                { x: 2050, y: initialPosition.y, heading: 0 },
                { x: 2450, y: initialPosition.y, heading: 0 },
                { x: 2850, y: initialPosition.y, heading: 0 },
                { x: 1800, y: 1000, heading: -(Math.PI / 2) },
                { x: 1800, y: 600, heading: -(Math.PI / 2) },
                { x: 1800, y: 400, heading: -(Math.PI / 2) },
            ];
            for (let scanPositionIndex = 0; scanPositionIndex < scanPositions.length; scanPositionIndex += 1) {
                const scanPosition = scanPositions[scanPositionIndex];
                const isAtLastScanPosition = scanPositionIndex === scanPositions.length - 1;
                const isScanPositionInSquareC = isPositionInAreaC(halfArenaHeight, scanPosition);
                const isRobotInSquareC = isPositionInAreaC(halfArenaHeight, motion.getPose());
                if (isScanPositionInSquareC && !isRobotInSquareC) {
                    yield motion.move2XYPhi(arenaCenterPosition, 0);
                    yield pause(250);
                    // motion.appendPose(icp.getPose());
                    yield verifyRotation(90, 60);
                    yield verifyPosition(arena, 0);
                    yield pause(250);
                }
                yield motion.move2XYPhi(scanPosition, scanPosition.heading);
                yield pause(250);
                // motion.appendPose(icp.getPose());
                if (scanPosition.heading === 0) {
                    yield verifyRotation(90, 60);
                    yield verifyPosition(arena, 0);
                }
                else {
                    yield verifyPositioninAreaC(arena, motion, scanPosition.heading);
                }
                const scanPose = motion.getPose();
                const localisedCans = yield localiseCans(scanRadius, matrix, scanPose, 30);
                const sortedLocalisedCans = [...localisedCans].sort((a, b) => calculateDistance(scanPose, a) - calculateDistance(scanPose, b));
                sortedLocalisedCans.forEach(({ row, column }) => matrix[row][column] = cellStates.OBSTACLE);
                logger.event(`${localisedCans.length} can(s) found at scan position ${scanPosition.x},${scanPosition.y}`);
                if (localisedCans.length) {
                    matrix.forEach(row => console.log(row.toString()));
                }
                for (let obstacleIndex = 0; obstacleIndex < sortedLocalisedCans.length; obstacleIndex += 1) {
                    const obstacle = sortedLocalisedCans[obstacleIndex];
                    if (obstacleIndex !== 0) {
                        if (isScanPositionInSquareC) {
                            yield motion.move2XYPhi(arenaCenterPosition, 0);
                            yield pause(250);
                            // motion.appendPose(icp.getPose());
                            yield verifyRotation(90, 60);
                            yield verifyPosition(arena, 0);
                        }
                        yield motion.move2XYPhi(scanPosition, scanPosition.heading);
                        yield pause(250);
                    }
                    yield motion.move2XY(obstacle, -config.GRIPPER_OBSTACLE_DISTANCE);
                    yield pause(250);
                    if (pickupAndReturn) {
                        try {
                            const canCenter = yield locateCan(config);
                            yield pickupCan(config, canCenter);
                        }
                        catch (error) {
                            console.log(error);
                            matrix[obstacle.row][obstacle.column] = cellStates.EMPTY;
                            continue;
                        }
                        yield motion.distanceHeading(-200, motion.getPose().phi);
                        yield pause(250);
                        if (isPositionInAreaC(halfArenaHeight, obstacle)) {
                            yield motion.move2XYPhi(arenaCenterPosition, 0);
                            yield pause(250);
                            // motion.appendPose(icp.getPose());
                            yield verifyRotation(90, 60);
                            yield verifyPosition(arena, 0);
                        }
                        yield motion.move2XY(canStoreCoordinates[numStoredCans], -config.GRIPPER_OBSTACLE_DISTANCE);
                        yield dropCan(config);
                        yield motion.distanceHeading(-150, motion.getPose().phi);
                        yield pause(250);
                        if (!isAtLastScanPosition) {
                            yield motion.move2XYPhi(verificationPosition, 0);
                            // motion.appendPose(icp.getPose());
                            yield verifyRotation(90, 60);
                            yield verifyPosition(arena, 0);
                            yield pause(250);
                        }
                    }
                    else {
                        try {
                            yield locateCan(config);
                        }
                        catch (error) {
                            console.log(error);
                            matrix[obstacle.row][obstacle.column] = cellStates.EMPTY;
                        }
                        yield gripper.setJawAngle(config.GRIPPER_JAW_WIDE_OPEN_ANGLE);
                        yield gripper.setJawAngle(config.GRIPPER_JAW_OPEN_ANGLE);
                        yield pause(5000); // give "someone" the time to remove the can
                    }
                    matrix[obstacle.row][obstacle.column] = cellStates.EMPTY;
                    numStoredCans += 1;
                }
                ;
                if (numStoredCans === maxNumCans || isAtLastScanPosition) {
                    const currentPose = motion.getPose();
                    const inSquareA = currentPose.x < 430;
                    if (!inSquareA) {
                        if (isPositionInAreaC(halfArenaHeight, currentPose)) {
                            yield motion.move2XY(arenaCenterPosition);
                        }
                        yield motion.move2XY(endPosition);
                    }
                    break;
                }
            }
            eventEmitter.emit('mission_complete');
        });
    }
    function localiseCans(scanRadius, matrix, pose, resolution) {
        return __awaiter(this, void 0, void 0, function* () {
            const measurements = averageMeasurements(yield scan(1000));
            const angleFilteredMeasurements = filterMeasurements(measurements, a => a >= 270 || a <= 90);
            const distanceFilteredMeasurements = filterMeasurements(angleFilteredMeasurements, a => angleFilteredMeasurements[a] < scanRadius);
            return obstacleDetection(matrix, pose, distanceFilteredMeasurements, resolution);
        });
    }
    function verifyPositioninAreaC(arena, motion, heading) {
        return __awaiter(this, void 0, void 0, function* () {
            const measurements = averageMeasurements(yield scan(1000));
            const pose = {
                x: arena.width / 3 + (measurements[270] || measurements[269] || measurements[271]),
                y: arena.height - measurements[180] || measurements[179] || measurements[181],
                phi: heading,
            };
            motion.appendPose(pose);
            return Promise.resolve();
        });
    }
    function isPositionInAreaC(halfArenaHeight, position) {
        return position.y < halfArenaHeight;
    }
    function stop() {
        motion.stop(true);
        motion.setTrackPose(false);
    }
    return {
        events: eventEmitter,
        start,
        stop,
    };
};
