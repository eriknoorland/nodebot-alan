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
exports.default = () => (logger, config, arena, sensors, actuators, utils, helpers, socket) => {
    const eventEmitter = new events_1.default();
    const { averageMeasurements } = utils.sensor.lidar;
    const { scan, getInitialPosition } = helpers;
    const { motion, gripper } = actuators;
    let currentPose = {};
    function start() {
        return __awaiter(this, void 0, void 0, function* () {
            const averagedMeasurements = averageMeasurements(yield scan(1000));
            const { x, y } = getInitialPosition(averagedMeasurements, arena.height);
            motion.on('pose', onPose);
            motion.setTrackPose(true);
            motion.appendPose({ x, y, phi: 0 });
            socket.on('ArrowUp', forward);
            socket.on('ArrowDown', reverse);
            socket.on('Space', stopMotors);
            socket.on('ArrowLeft', rotateLeft);
            socket.on('ArrowRight', rotateRight);
            socket.on('KeyY', onGripperLower);
            socket.on('KeyU', onGripperLift);
            socket.on('KeyI', onGripperOpen);
            socket.on('KeyO', onGripperWideOpen);
            socket.on('KeyP', onGripperClose);
            socket.on('waypoints', waypoints);
        });
    }
    function stop() {
        motion.off('pose', onPose);
        socket.removeListener('ArrowUp', forward);
        socket.removeListener('ArrowDown', reverse);
        socket.removeListener('Space', stopMotors);
        socket.removeListener('ArrowLeft', rotateLeft);
        socket.removeListener('ArrowRight', rotateRight);
        socket.removeListener('KeyY', onGripperLower);
        socket.removeListener('KeyU', onGripperLift);
        socket.removeListener('KeyI', onGripperOpen);
        socket.removeListener('KeyO', onGripperWideOpen);
        socket.removeListener('KeyP', onGripperClose);
        socket.removeListener('waypoints', waypoints);
        motion.setTrackPose(false);
    }
    function forward() {
        const heading = currentPose.phi || 0;
        motion.speedHeading(config.MAX_SPEED, heading, () => { });
    }
    function reverse() {
        const heading = currentPose.phi || 0;
        motion.speedHeading(-config.MAX_SPEED, heading, () => { });
    }
    function stopMotors() {
        motion.stop();
    }
    function rotateLeft() {
        motion.rotate(-Math.PI / 2);
    }
    function rotateRight() {
        motion.rotate(Math.PI / 2);
    }
    function onGripperLower() {
        gripper.setLiftAngle(config.GRIPPER_LIFT_DOWN_ANGLE);
    }
    function onGripperLift() {
        gripper.setLiftAngle(config.GRIPPER_LIFT_UP_ANGLE);
    }
    function onGripperOpen() {
        gripper.setJawAngle(config.GRIPPER_JAW_OPEN_ANGLE);
    }
    function onGripperWideOpen() {
        gripper.setJawAngle(config.GRIPPER_JAW_WIDE_OPEN_ANGLE);
    }
    function onGripperClose() {
        gripper.setJawAngle(config.GRIPPER_JAW_CLOSE_ANGLE);
    }
    function waypoints(waypoints) {
        waypoints.reduce((acc, waypoint) => acc.then(_ => motion.move2XY(waypoint)), Promise.resolve());
    }
    function onPose(pose) {
        currentPose = pose;
    }
    return {
        events: eventEmitter,
        start,
        stop,
    };
};
