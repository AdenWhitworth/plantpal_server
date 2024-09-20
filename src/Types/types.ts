import { Request, Response, NextFunction } from 'express';
import { Socket } from 'socket.io';

/**
 * Represents a user with their attributes.
 * @interface
 */
export interface User {
    /** The user's unique identifier. */
    user_id: number;
    /** The user's first name. */
    first_name: string;
    /** The user's last name. */
    last_name: string;
    /** The user's email address. */
    email: string;
    /** The user's password (hashed). */
    password: string;
    /** The last login timestamp, or null if not logged in. */
    last_login: string | null;
    /** Optional refresh token for the user session. */
    refresh_token?: string | null;
    /** Optional reset token for password recovery. */
    reset_token?: string | null;
    /** Optional expiry timestamp for the reset token. */
    reset_token_expiry?: string | null;
    /** Optional socket identifier for real-time communication. */
    socket_id?: string | null;
}

/**
 * Represents a device with its attributes.
 * @interface
 */
export interface Device {
    /** The unique identifier for the device. */
    device_id: number;
    /** The catalog number of the device. */
    cat_num: string;
    /** The identifier of the user who owns the device. */
    user_id: number;
    /** The Wi-Fi SSID for device connectivity. */
    wifi_ssid: string;
    /** The Wi-Fi password for device connectivity. */
    wifi_password: string;
    /** The initialization vector used for encryption. */
    init_vec: string;
    /** Indicates whether the device has a presence connection. */
    presence_connection: boolean;
    /** The location of the device. */
    location: string;
    /** The name assigned to the device in the IoT system. */
    thing_name: string;
}

/**
 * Represents a log entry for a device.
 * @interface
 */
export interface DeviceLog {
    /** The unique identifier for the log entry. */
    log_id: number;
    /** The catalog number of the device associated with the log. */
    cat_num: string;
    /** The soil temperature recorded in the log. */
    soil_temp: number;
    /** The soil capacitance recorded in the log. */
    soil_cap: number;
    /** The date of the log entry. */
    log_date: string;
    /** Indicates whether the device watered the plants. */
    water: boolean;
}

/**
 * Represents the state of a device shadow in IoT.
 * @interface
 */
export interface DeviceShadow {
    /** The reported and desired state of the device. */
    state: {
        reported: {
            /** Welcome message for the device. */
            welcome: string;
            /** Indicates whether the device is connected. */
            connected: boolean;
            /** Indicates whether the device is in auto mode. */
            auto: boolean;
            /** Indicates whether the pump is active. */
            pump: boolean;
        };
        desired: {
            /** Welcome message for the device. */
            welcome: string;
            /** Indicates whether the device should be connected. */
            connected: boolean;
            /** Indicates whether the device should be in auto mode. */
            auto: boolean;
            /** Indicates whether the pump should be active. */
            pump: boolean;
        };
    };
    /** Optional metadata associated with the device shadow. */
    metadata?: any;
}

/**
 * Represents a factory device with its attributes.
 * @interface
 */
export interface FactoryDevice {
    /** The unique identifier for the factory. */
    factory_id: number;
    /** The category number of the factory device. */
    cat_num: string;
    /** The date associated with the factory device. */
    factory_date: string;
    /** The name assigned to the factory device. */
    thing_name: string;
}

/**
 * A function type that generates an access token for a user.
 * @type
 * @param {User} user - The user for whom to generate the access token.
 * @returns {string} The generated access token.
 */
export type GenerateAccessTokenFunction = (user: User) => string;

/**
 * A function type that generates a refresh token for a user.
 * @typed
 * @param {User} user - The user for whom to generate the refresh token.
 * @returns {Promise<string>} The generated refresh token.
 */
export type GenerateRefreshTokenFunction = (user: User) => Promise<string>;

/**
 * A function type that generates a reset token for a user.
 * @type
 * @param {User} user - The user for whom to generate the reset token.
 * @returns {Promise<string>} The generated reset token.
 */
export type GenerateResetTokenFunction = (user: User) => Promise<string>;

/**
 * Represents the structure of the encrypted data.
 * @interface
 */
export interface EncryptedData {
    /** The initialization vector used for encryption. */
    iv: string;
    /** The encrypted content as a hex string. */
    content: string;
}

/**
 * Represents the structure of the hash data used for decryption.
 * @interface
 */
export interface HashData {
    /** The initialization vector used for decryption. */
    iv: string;
    /** The hashed content as a hex string. */
    content: string;
}

/**
 * Represents the payload structure for the token.
 * @interface
 */
export interface TokenPayload {
    /** The unique identifier for the user. */
    user_id: number;
}

/**
 * Interface defining the structure of the email options object.
 * This object is passed to the sendEmail function to specify the email details.
 * @interface
 */
export interface MailOptions {
    /** The sender's email address. */
    from: string;
    /** The recipient's email address. */
    to: string;
    /** The subject line of the email. */
    subject: string;
    /** Optional plain text content of the email. */
    text?: string;
    /** Optional HTML content of the email. */
    html?: string;
}

/**
 * Represents the response structure for socket callbacks.
 * @type
 * @property {boolean} error - Indicates if there was an error.
 * @property {string} [message] - Optional message providing additional information.
 * @property {number} [user_id] - Optional identifier for the user associated with the callback.
 */
export type CallbackResponse = {
    error: boolean;
    message?: string;
    user_id?: number;
};

/**
 * Represents the response structure for the middleware validation
 * @type
 * @property {interface} Request - Indicates if there was an error.
 * @property {interface} Response - Optional message providing additional information.
 * @property {interface} NextFunction - Optional identifier for the user associated with the callback.
 */

/**
 * A function type that defines the response structure for the middleware validation.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} The middleware validation function
 */
export type ValidationMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Interface defining the structure of the access token request.
 * @interface
 * @extends Request
 * @property {number} [user_id] - The ID of the user associated with the socket.
 */
export interface AccessTokenRequest extends Request {
    /** The ID of the user associated with the access token. */
    user_id?: number;
}

/**
 * Interface defining the structure of the access token request.
 * @interface
 * @extends Socket
 * @property {number} [user_id] - The ID of the user associated with the socket.
 */
export interface AccessTokenSocket extends Socket {
    /** The ID of the user associated with the access token. */
    user_id?: number;
  }

/**
 * Interface representing the overall state structure.
 * Contains both desired and reported states.
 * @interface State
 */
export interface State {
    /** 
     * The desired state configuration.
     * @type {DesiredState}
     */
    desired: DesiredState;

    /** 
     * The reported state configuration (optional).
     * @type {ReportedState}
     */
    reported?: ReportedState;
}

/**
 * Interface defining the desired state configuration.
 * @interface DesiredState
 */
export interface DesiredState {
    /** Indicates whether the pump is currently on (optional). */
    pump?: boolean;

    /** Indicates whether automatic control is currently enabled (optional). */
    auto?: boolean;
}

/**
 * Interface defining the reported state configuration.
 * @interface
 */
export interface ReportedState {
    /** Indicates whether the pump is currently on (optional). */
    pump?: boolean;

    /** Indicates whether automatic control is currently enabled (optional). */
    auto?: boolean;
}