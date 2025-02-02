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
    const { getArenaMatrix, cellStates } = utils;
    const { verifyRotation, verifyPosition, localiseCans } = helpers;
    const { motion } = actuators;
    function start() {
        return __awaiter(this, void 0, void 0, function* () {
            const matrixResolution = 30;
            motion.setTrackPose(true);
            const scanRadius = 900;
            const matrix = getArenaMatrix(arena.width, arena.height, matrixResolution);
            yield verifyRotation(90, 60);
            yield verifyPosition(arena, 0);
            const scanPose = motion.getPose();
            const localisedCans = yield localiseCans(scanRadius, matrix, scanPose, matrixResolution);
            // mark matrix
            const pose = motion.getPose();
            const row = Math.floor(pose.y / matrixResolution);
            const column = Math.floor(pose.x / matrixResolution);
            matrix[row][column] = '|';
            localisedCans.forEach(({ row, column }) => matrix[row][column] = cellStates.OBSTACLE);
            // visualize
            matrix.forEach(row => console.log(row.toString()));
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
