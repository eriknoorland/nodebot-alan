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
    const { motion } = actuators;
    function start() {
        return __awaiter(this, void 0, void 0, function* () {
            let totalLeftTicks = 0;
            let totalRightTicks = 0;
            motion.on('odometry', ({ leftTicks, rightTicks }) => {
                totalLeftTicks += leftTicks;
                totalRightTicks += rightTicks;
            });
            const startPose = { x: 200, y: arena.height * 0.75, phi: 0 };
            motion.setTrackPose(true);
            motion.appendPose(startPose);
            console.log(config.LEFT_WHEEL_DIAMETER, config.LEFT_WHEEL_CIRCUMFERENCE, config.LEFT_DISTANCE_PER_TICK, config.RIGHT_WHEEL_DIAMETER, config.RIGHT_WHEEL_CIRCUMFERENCE, config.RIGHT_DISTANCE_PER_TICK);
            yield motion.distanceHeading(distance, 0);
            const endPose = motion.getPose();
            const poseDiffX = endPose.x - startPose.x;
            console.log({
                totalLeftTicks,
                totalRightTicks,
                poseDiffX,
            });
            console.log('virtual distance left:', totalLeftTicks * config.LEFT_DISTANCE_PER_TICK);
            console.log('virtual distance right:', totalRightTicks * config.RIGHT_DISTANCE_PER_TICK);
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
