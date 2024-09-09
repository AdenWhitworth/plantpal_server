import { Response } from 'express';

interface Device {
    device_id: number;
    cat_num: string;
    user_id: number;
    wifi_ssid: string;
    wifi_password: string;
    init_vec: string;
    presence_connection: boolean;
    location: string;
    thing_name: string;
};

interface DeviceLog {
    log_id: number;
    cat_num: string;
    soil_temp: number;
    soil_cap: number;
    log_date: string;
    water: boolean;
};

export const successHandler = (message: string, statusCode: number, res: Response, accessToken?: string, devices?: Device[], deviceLogs?: DeviceLog[], lastLog?: DeviceLog, device?: Device) => {
    statusCode = statusCode || 200;
    message = message || 'Success';

    return res.status(statusCode).json({ message, accessToken, devices, deviceLogs, lastLog, device});
    
}