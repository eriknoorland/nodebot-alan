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
exports.default = (distance) => (logger, config, arena, sensors, actuators, utils, helpers) => {
    const eventEmitter = new events_1.default();
    const { pause } = utils.robotlib;
    const { averageMeasurements, getAngleDistance } = utils.sensor.lidar;
    const { scan, startVector, gotoStartPosition, getInitialPosition } = helpers;
    const { motion } = actuators;
    function start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield startVector();
            yield pause(250);
            // const startPositionAveragedMeasurements = averageMeasurements(await scan(2000));
            // await gotoStartPosition(startPositionAveragedMeasurements);
            const initialPositionAveragedMeasurements = averageMeasurements(yield scan(2000));
            const { x, y } = getInitialPosition(initialPositionAveragedMeasurements, arena.height);
            const startRightDistance = getAngleDistance(initialPositionAveragedMeasurements, 90);
            motion.setTrackPose(true);
            motion.appendPose({ x, y, phi: 0 });
            const startPose = motion.getPose();
            yield motion.distanceHeading(distance, 0);
            const endPositionAveragedMeasurements = averageMeasurements(yield scan(2000));
            const endRightDistance = getAngleDistance(endPositionAveragedMeasurements, 90);
            const distanceDiff = endRightDistance - startRightDistance;
            const endPose = motion.getPose();
            const poseDiffX = endPose.x - startPose.x;
            const poseDiffY = endPose.y - startPose.y;
            console.log({
                startRightDistance,
                endRightDistance,
                distanceDiff,
                startPose,
                endPose,
                poseDiffX,
                poseDiffY,
            });
            eventEmitter.emit('mission_complete');
        });
    }
    function stop() {
        motion.stop(true);
    }
    return {
        events: eventEmitter,
        start,
        stop,
    };
};
