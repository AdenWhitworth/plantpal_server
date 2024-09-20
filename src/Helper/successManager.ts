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

interface User {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    last_login: string | null;
    refresh_token?: string | null;
    reset_token?: string | null;
    reset_token_expiry?: string | null;
    socket_id?: string | null;
}

interface DeviceShadow {
    state: {
        reported: {
            welcome: string;
            connected: boolean;
            auto: boolean;
            pump: boolean;
        };
        desired: {
            welcome: string;
            connected: boolean;
            auto: boolean;
            pump: boolean;
        };
    };
    metadata?: any;
}

export const successHandler = (message: string, statusCode: number, res: Response, accessToken?: string, devices?: Device[], deviceLogs?: DeviceLog[], lastLog?: DeviceLog, device?: Device, user?: User, deviceShadow?: DeviceShadow) => {
    statusCode = statusCode || 200;
    message = message || 'Success';

    return res.status(statusCode).json({ message, accessToken, devices, deviceLogs, lastLog, device, user, deviceShadow});
    
}