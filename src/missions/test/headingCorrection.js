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
    const { deg2rad } = utils.robotlib.math;
    const { averageMeasurements } = utils.sensor.lidar;
    const { scan, startVector, getInitialPosition } = helpers;
    const { motion } = actuators;
    function start() {
        return __awaiter(this, void 0, void 0, function* () {
            // simple test
            // motion.setTrackPose(true);
            // motion.appendPose({ x: 200, y: arena.height * 0.75, phi: 0 });
            // await motion.distanceHeading(distance, deg2rad(5));
            yield startVector();
            yield pause(250);
            const initialPositionMeasurements = averageMeasurements(yield scan(2000));
            const { x, y } = getInitialPosition(initialPositionMeasurements, arena.height);
            motion.setTrackPose(true);
            motion.appendPose({ x, y, phi: 0 });
            yield motion.rotate(deg2rad(5));
            yield pause(1000);
            yield motion.distanceHeading(distance, 0);
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
