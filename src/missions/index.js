"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const backAndForth_1 = __importDefault(require("./backAndForth"));
const superSlalom_1 = __importDefault(require("./superSlalom"));
const lineFollower_1 = __importDefault(require("./lineFollower"));
const tTime_1 = __importDefault(require("./tTime"));
const cans_1 = __importDefault(require("./cans"));
const remote_1 = __importDefault(require("./test/remote"));
const distance_1 = __importDefault(require("./test/distance"));
const heading_1 = __importDefault(require("./test/heading"));
const headingCorrection_1 = __importDefault(require("./test/headingCorrection"));
const rotation_1 = __importDefault(require("./test/rotation"));
const straightLine_1 = __importDefault(require("./test/straightLine"));
const lidarAlignment_1 = __importDefault(require("./test/lidarAlignment"));
const imuOdomLine_1 = __importDefault(require("./test/imuOdomLine"));
const umbMark_1 = __importDefault(require("./test/umbMark"));
const startVector_1 = __importDefault(require("./test/startVector"));
const startPosition_1 = __importDefault(require("./test/startPosition"));
const verifyRotation_1 = __importDefault(require("./test/verifyRotation"));
const verifyPosition_1 = __importDefault(require("./test/verifyPosition"));
const pickupCan_1 = __importDefault(require("./test/pickupCan"));
const canDetection_1 = __importDefault(require("./test/canDetection"));
const icp_1 = __importDefault(require("./test/icp"));
const missions = [
    { name: 'Heen & Weer', module: (0, backAndForth_1.default)() },
    { name: 'Super Slalom', module: (0, superSlalom_1.default)() },
    { name: 'Lijnvolgen', module: (0, lineFollower_1.default)() },
    { name: 'Lijnvolgen met Obstakel', module: (0, lineFollower_1.default)(true) },
    { name: 'T-Tijd', module: (0, tTime_1.default)() },
    { name: 'T-Tijd met smalle doorgang', module: (0, tTime_1.default)() },
    { name: 'Blikken', module: (0, cans_1.default)() },
    { name: 'Blikken Retour', module: (0, cans_1.default)(true) },
];
const testMissions = [
    { name: '[Test] Remote', module: (0, remote_1.default)() },
    { name: '[Test] Rechtuit 1m', module: (0, distance_1.default)(1000) },
    { name: '[Test] Rechtuit 2m', module: (0, distance_1.default)(2000) },
    { name: '[Test] Rechtuit 3m', module: (0, distance_1.default)(3000) },
    { name: '[Test] Rechtuit 4m', module: (0, distance_1.default)(4000) },
    { name: '[Test] Heading 1m', module: (0, heading_1.default)(1000) },
    { name: '[Test] Heading 2m', module: (0, heading_1.default)(2000) },
    { name: '[Test] Heading 3m', module: (0, heading_1.default)(3000) },
    { name: '[Test] Heading correctie 1m', module: (0, headingCorrection_1.default)(1000) },
    { name: '[Test] Heading correctie 2m', module: (0, headingCorrection_1.default)(2000) },
    { name: '[Test] Heading correctie 3m', module: (0, headingCorrection_1.default)(3000) },
    { name: '[Test] Draai 1x rond CW', module: (0, rotation_1.default)(1) },
    { name: '[Test] Draai 5x rond CW', module: (0, rotation_1.default)(5) },
    { name: '[Test] Draai 10x rond CW', module: (0, rotation_1.default)(10) },
    { name: '[Test] Draai 1x rond CCW', module: (0, rotation_1.default)(-1) },
    { name: '[Test] Draai 5x rond CCW', module: (0, rotation_1.default)(-5) },
    { name: '[Test] Draai 10x rond CCW', module: (0, rotation_1.default)(-10) },
    { name: '[Test] Heen & weer 1m CW', module: (0, straightLine_1.default)(1000) },
    { name: '[Test] Heen & weer 2m CW', module: (0, straightLine_1.default)(2000) },
    { name: '[Test] Heen & weer 3m CW', module: (0, straightLine_1.default)(3000) },
    { name: '[Test] Heen & weer 4m CW', module: (0, straightLine_1.default)(4000) },
    { name: '[Test] Heen & weer 1m CCW', module: (0, straightLine_1.default)(1000, -1) },
    { name: '[Test] Heen & weer 2m CCW', module: (0, straightLine_1.default)(2000, -1) },
    { name: '[Test] Heen & weer 3m CCW', module: (0, straightLine_1.default)(3000, -1) },
    { name: '[Test] Heen & weer 4m CCW', module: (0, straightLine_1.default)(4000, -1) },
    { name: '[Test] IMU odometry with linefollow track', module: (0, imuOdomLine_1.default)() },
    { name: '[Test] UMBMark 1m CW', module: (0, umbMark_1.default)(1000) },
    { name: '[Test] UMBMark 2m CW', module: (0, umbMark_1.default)(2000) },
    { name: '[Test] UMBMark 3m CW', module: (0, umbMark_1.default)(3000) },
    { name: '[Test] UMBMark 4m CW', module: (0, umbMark_1.default)(4000) },
    { name: '[Test] UMBMark 1m CCW', module: (0, umbMark_1.default)(1000, -1) },
    { name: '[Test] UMBMark 2m CCW', module: (0, umbMark_1.default)(2000, -1) },
    { name: '[Test] UMBMark 3m CCW', module: (0, umbMark_1.default)(3000, -1) },
    { name: '[Test] UMBMark 4m CCW', module: (0, umbMark_1.default)(4000, -1) },
    { name: '[Test] Lidar alignment', module: (0, lidarAlignment_1.default)() },
    { name: '[Test] Start vector', module: (0, startVector_1.default)() },
    { name: '[Test] Start position', module: (0, startPosition_1.default)() },
    { name: '[Test] Start position - 300', module: (0, startPosition_1.default)(-300) },
    { name: '[Test] Start position + 300', module: (0, startPosition_1.default)(300) },
    { name: '[Test] Verifieër rotatie rechts', module: (0, verifyRotation_1.default)(90) },
    { name: '[Test] Verifieër rotatie links', module: (0, verifyRotation_1.default)(270) },
    { name: '[Test] Verifieër positie', module: (0, verifyPosition_1.default)() },
    { name: '[Test] Blik pakken', module: (0, pickupCan_1.default)() },
    { name: '[Test] Blikken detecteren', module: (0, canDetection_1.default)() },
    { name: '[Test] ICP', module: (0, icp_1.default)() },
    { name: '[Test] Remote', module: (0, remote_1.default)() },
];
exports.default = [
    ...missions,
    { name: '--', module: null },
    ...testMissions
];
