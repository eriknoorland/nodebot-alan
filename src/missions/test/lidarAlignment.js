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
    const { deg2rad, rad2deg } = utils.robotlib.math;
    const { averageMeasurements, filterMeasurements } = utils.sensor.lidar;
    const { scan } = helpers;
    const { motion } = actuators;
    function start() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.log('start', 'testLidarAlignment');
            const measurements = averageMeasurements(yield scan(2000));
            const filteredMeasurements = filterMeasurements(measurements, (a) => a >= 45 && a <= 135);
            const points = Object
                .keys(filteredMeasurements)
                .map(angle => {
                const distance = filteredMeasurements[angle];
                const angleRad = deg2rad(parseInt(angle, 10));
                const x = Math.cos(angleRad) * distance;
                const y = Math.sin(angleRad) * distance;
                return { angle, distance, x, y };
            });
            const firstPoint = points[0];
            const lastPoint = points[points.length - 1];
            const s = firstPoint.x - lastPoint.x;
            const o = firstPoint.y - lastPoint.y;
            const sin = Math.sin(o / s);
            console.log({ o, s, sin }, rad2deg(sin));
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
