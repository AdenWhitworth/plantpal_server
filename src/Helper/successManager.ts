import { Response } from 'express';
import { Device, DeviceLog, DeviceShadow, User } from '../Types/types';

/**
 * Sends a success response with optional data.
 *
 * @param {string} message - The success message to return.
 * @param {number} statusCode - The HTTP status code for the response (default is 200).
 * @param {Response} res - The Express response object used to send the response.
 * @param {string} [accessToken] - An optional access token to include in the response.
 * @param {Device[]} [devices] - An optional array of devices to include in the response.
 * @param {DeviceLog[]} [deviceLogs] - An optional array of device logs to include in the response.
 * @param {DeviceLog} [lastLog] - An optional last log entry to include in the response.
 * @param {Device} [device] - An optional specific device to include in the response.
 * @param {User} [user] - An optional user object to include in the response.
 * @param {DeviceShadow} [deviceShadow] - An optional device shadow to include in the response.
 * @returns {Response} The Express response object with the JSON data.
 */
export const successHandler = (message: string, statusCode: number, res: Response, accessToken?: string, devices?: Device[], deviceLogs?: DeviceLog[], lastLog?: DeviceLog, device?: Device, user?: User, deviceShadow?: DeviceShadow) => {
    statusCode = statusCode || 200;
    message = message || 'Success';

    return res.status(statusCode).json({ message, accessToken, devices, deviceLogs, lastLog, device, user, deviceShadow});
}