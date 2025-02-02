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
    const { deg2rad } = utils.robotlib.math;
    const { averageMeasurements, scanObject2Array, getShortestDistance } = utils.sensor.lidar;
    const { scan, pickupCan, dropCan } = helpers;
    const { motion } = actuators;
    function start() {
        return __awaiter(this, void 0, void 0, function* () {
            const pose = { x: 0, y: 0, phi: 0 };
            const measurements = averageMeasurements(yield scan(2000));
            const { angle, distance } = getShortestDistance(scanObject2Array(measurements));
            const pickupCanPosition = {
                x: pose.x + Math.cos(deg2rad(angle)) * distance,
                y: pose.y + Math.sin(deg2rad(angle)) * distance,
            };
            motion.appendPose(pose);
            yield motion.move2XY(pickupCanPosition, -config.GRIPPER_OBSTACLE_DISTANCE);
            try {
                const canCenter = yield helpers.locateCan(config);
                yield pickupCan(config, canCenter);
            }
            catch (error) {
                console.log(error);
            }
            yield motion.move2XY(pose);
            yield dropCan(config);
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
