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
    const { startPosition } = helpers;
    const { icp } = sensors;
    const { motion } = actuators;
    function start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield startPosition(arena.height);
            let heading = 0;
            yield motion.distanceHeading(1000, heading);
            console.log(getPose());
            heading = Math.PI / 2;
            yield motion.rotate(heading);
            console.log(getPose());
            yield motion.distanceHeading(200, heading);
            console.log(getPose());
            // heading = 0;
            // await motion.rotate(-(Math.PI / 2));
            // console.log(getPose());
            // await motion.distanceHeading(500, heading);
            // console.log(getPose());
            // heading = Math.PI;
            // await motion.rotate(heading);
            // console.log(getPose());
            // await motion.distanceHeading(1000, heading);
            // console.log(getPose());
            eventEmitter.emit('mission_complete');
        });
    }
    function stop() {
        motion.stop(true);
    }
    function getPose() {
        return {
            odom: motion.getPose(),
            icp: icp.getPose(),
        };
    }
    return {
        events: eventEmitter,
        start,
        stop,
    };
};
