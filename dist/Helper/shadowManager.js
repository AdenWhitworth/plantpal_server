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
exports.getDeviceShadow = exports.updateDeviceShadow = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
/**
 * AWS SDK configuration for accessing IoT services.
 */
aws_sdk_1.default.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});
const iotData = new aws_sdk_1.default.IotData({ endpoint: process.env.AWS_IOT_ENDPOINT });
/**
 * Updates the device shadow in AWS IoT.
 *
 * @param {string} thingName - The name of the thing in AWS IoT.
 * @param {DesiredState} desiredState - The desired state to be set.
 * @param {ReportedState} [reportedState] - The reported state (optional).
 * @returns {Promise<any>} The response from AWS IoT.
 * @throws {Error} If the update fails.
 */
const updateDeviceShadow = (thingName, desiredState, reportedState) => __awaiter(void 0, void 0, void 0, function* () {
    const state = {
        desired: desiredState
    };
    if (reportedState !== undefined) {
        state.reported = reportedState;
    }
    const params = {
        thingName: thingName,
        payload: JSON.stringify({
            state: state
        })
    };
    try {
        const response = yield iotData.updateThingShadow(params).promise();
        const data = JSON.parse(response.payload);
        return data;
    }
    catch (error) {
        throw new Error('Failed to update device shadow.');
    }
});
exports.updateDeviceShadow = updateDeviceShadow;
/**
 * Retrieves the device shadow from AWS IoT.
 *
 * @param {string} thingName - The name of the thing in AWS IoT.
 * @returns {Promise<any>} The device shadow data.
 * @throws {Error} If the retrieval fails.
 */
const getDeviceShadow = (thingName) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        thingName: thingName
    };
    try {
        const response = yield iotData.getThingShadow(params).promise();
        const data = JSON.parse(response.payload);
        return data;
    }
    catch (error) {
        throw new Error('Failed to get device shadow.');
    }
});
exports.getDeviceShadow = getDeviceShadow;
