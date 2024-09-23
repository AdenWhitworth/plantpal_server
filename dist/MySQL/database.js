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
exports.pool = void 0;
exports.getUsers = getUsers;
exports.getUserByEmail = getUserByEmail;
exports.getUserById = getUserById;
exports.createUser = createUser;
exports.updateLastLoginTime = updateLastLoginTime;
exports.updateUserInfo = updateUserInfo;
exports.updateUserPassword = updateUserPassword;
exports.updateRefreshToken = updateRefreshToken;
exports.updateResetToken = updateResetToken;
exports.clearResetToken = clearResetToken;
exports.getUserDevices = getUserDevices;
exports.getUserDevice = getUserDevice;
exports.addUserDevice = addUserDevice;
exports.updateDeviceWifi = updateDeviceWifi;
exports.getFactoryDevice = getFactoryDevice;
exports.getDeviceLogs = getDeviceLogs;
exports.getLastDeviceLog = getLastDeviceLog;
exports.updateUserSocketId = updateUserSocketId;
exports.getUserBySocket = getUserBySocket;
exports.getDevice = getDevice;
exports.getDeviceThing = getDeviceThing;
exports.updatePresenceConnection = updatePresenceConnection;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * MySQL connection pool for managing database connections.
 * @constant {mysql.Pool} pool
 */
exports.pool = promise_1.default.createPool({
    host: process.env.RDS_ENDPOINT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    timezone: '+00:00'
});
/**
 * Retrieves all users from the database.
 * @returns {Promise<User[]>} A promise that resolves to an array of users.
 */
function getUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        const [rows] = yield exports.pool.query("SELECT * FROM users");
        return rows;
    });
}
/**
 * Retrieves a user by their email address.
 * @param {string} email - The email address of the user.
 * @returns {Promise<User | undefined>} A promise that resolves to the user or undefined if not found.
 */
function getUserByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        const [rows] = yield exports.pool.query(`SELECT * FROM users WHERE Lower(email) = ?`, [email]);
        return rows[0];
    });
}
/**
 * Retrieves a user by their unique identifier.
 * @param {number} user_id - The unique identifier of the user.
 * @returns {Promise<User | undefined>} A promise that resolves to the user or undefined if not found.
 */
function getUserById(user_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const [rows] = yield exports.pool.query(`SELECT * FROM users WHERE user_id = ?`, [user_id]);
        return rows[0];
    });
}
/**
 * Creates a new user in the database.
 * @param {string} first_name - The first name of the user.
 * @param {string} last_name - The last name of the user.
 * @param {string} email - The email address of the user.
 * @param {string} password - The password for the user (hashed).
 * @returns {Promise<User | undefined>} A promise that resolves to the created user or undefined if unsuccessful.
 */
function createUser(first_name, last_name, email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const [result] = yield exports.pool.query(`INSERT INTO users (first_name, last_name, email, password, last_login) VALUES(?, ?, ?, ?, NULL)`, [first_name, last_name, email, password]);
        const user_id = result.insertId;
        return getUserById(user_id);
    });
}
/**
 * Updates the last login time for a user.
 * @param {number} user_id - The unique identifier of the user.
 * @returns {Promise<User | undefined>} A promise that resolves to the updated user or undefined if not found.
 */
function updateLastLoginTime(user_id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exports.pool.query(`UPDATE users SET last_login = now() WHERE user_id = ?`, [user_id]);
        return getUserById(user_id);
    });
}
/**
 * Updates user information in the database.
 * @param {number} user_id - The unique identifier of the user.
 * @param {string} first_name - The updated first name of the user.
 * @param {string} last_name - The updated last name of the user.
 * @param {string} email - The updated email address of the user.
 * @returns {Promise<User | undefined>} A promise that resolves to the updated user or undefined if not found.
 */
function updateUserInfo(user_id, first_name, last_name, email) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exports.pool.query(`UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE user_id = ?`, [first_name, last_name, email, user_id]);
        return getUserById(user_id);
    });
}
/**
 * Updates the password for a user.
 * @param {number} user_id - The unique identifier of the user.
 * @param {string} password - The new password for the user (hashed).
 * @returns {Promise<User | undefined>} A promise that resolves to the updated user or undefined if not found.
 */
function updateUserPassword(user_id, password) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exports.pool.query(`UPDATE users SET password = ? WHERE user_id = ?`, [password, user_id]);
        return getUserById(user_id);
    });
}
/**
 * Updates the refresh token for a user.
 * @param {number} user_id - The unique identifier of the user.
 * @param {string} refreshToken - The new refresh token for the user.
 * @returns {Promise<User | undefined>} A promise that resolves to the updated user or undefined if not found.
 */
function updateRefreshToken(user_id, refreshToken) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exports.pool.query(`UPDATE users SET refresh_token = ? WHERE user_id = ?`, [refreshToken, user_id]);
        return getUserById(user_id);
    });
}
/**
 * Updates the reset token and its expiry for a user.
 * @param {number} user_id - The unique identifier of the user.
 * @param {string} resetToken - The new reset token for the user.
 * @param {string} resetTokenExpiry - The expiry timestamp for the reset token.
 * @returns {Promise<User | undefined>} A promise that resolves to the updated user or undefined if not found.
 */
function updateResetToken(user_id, resetToken, resetTokenExpiry) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exports.pool.query(`UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE user_id = ?`, [resetToken, resetTokenExpiry, user_id]);
        return getUserById(user_id);
    });
}
/**
 * Clears the reset token and its expiry for a user.
 * @param {number} user_id - The unique identifier of the user.
 * @returns {Promise<User | undefined>} A promise that resolves to the updated user or undefined if not found.
 */
function clearResetToken(user_id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exports.pool.query(`UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE user_id = ?`, [user_id]);
        return getUserById(user_id);
    });
}
/**
 * Retrieves all devices associated with a user.
 * @param {number} user_id - The unique identifier of the user.
 * @returns {Promise<Device[]>} A promise that resolves to an array of devices.
 */
function getUserDevices(user_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const [rows] = yield exports.pool.query(`SELECT * FROM devices WHERE user_id = ?`, [user_id]);
        return rows;
    });
}
/**
 * Retrieves a device by its unique identifier.
 * @param {number} device_id - The unique identifier of the device.
 * @returns {Promise<Device | undefined>} A promise that resolves to the device or undefined if not found.
 */
function getUserDevice(device_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const [rows] = yield exports.pool.query(`SELECT * FROM devices WHERE device_id = ?`, [device_id]);
        return rows[0];
    });
}
/**
 * Adds a new device for a user.
 * @param {string} cat_num - The category number of the device.
 * @param {number} user_id - The unique identifier of the user.
 * @param {string} wifi_ssid - The Wi-Fi SSID for the device.
 * @param {string} wifi_password - The Wi-Fi password for the device.
 * @param {string} init_vec - The initialization vector for encryption.
 * @param {boolean} presence_connection - Indicates if the device has a presence connection.
 * @param {string} location - The location of the device.
 * @param {string} thing_name - The name assigned to the device in the IoT system.
 * @returns {Promise<Device | undefined>} A promise that resolves to the added device or undefined if unsuccessful.
 */
function addUserDevice(cat_num, user_id, wifi_ssid, wifi_password, init_vec, presence_connection, location, thing_name) {
    return __awaiter(this, void 0, void 0, function* () {
        const [result] = yield exports.pool.query(`INSERT INTO devices (cat_num, user_id, wifi_ssid, wifi_password, init_vec, presence_connection, location, thing_name) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`, [cat_num, user_id, wifi_ssid, wifi_password, init_vec, presence_connection, location, thing_name]);
        const device_id = result.insertId;
        return getUserDevice(device_id);
    });
}
/**
 * Updates the Wi-Fi settings for a device.
 * @param {number} device_id - The unique identifier of the device.
 * @param {string} wifi_ssid - The new Wi-Fi SSID.
 * @param {string} wifi_password - The new Wi-Fi password.
 * @param {string} init_vec - The new initialization vector.
 * @returns {Promise<Device | undefined>} A promise that resolves to the updated device or undefined if not found.
 */
function updateDeviceWifi(device_id, wifi_ssid, wifi_password, init_vec) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exports.pool.query(`UPDATE devices SET wifi_ssid = ?, wifi_password = ?, init_vec = ? WHERE device_id = ?`, [wifi_ssid, wifi_password, init_vec, device_id]);
        return getUserDevice(device_id);
    });
}
/**
 * Retrieves a factory device by its category number.
 * @param {string} cat_num - The category number of the factory device.
 * @returns {Promise<FactoryDevice | undefined>} A promise that resolves to the factory device or undefined if not found.
 */
function getFactoryDevice(cat_num) {
    return __awaiter(this, void 0, void 0, function* () {
        const [rows] = yield exports.pool.query(`SELECT * FROM factoryDevices WHERE cat_num = ?`, [cat_num]);
        return rows[0];
    });
}
/**
 * Retrieves logs associated with a device.
 * @param {string} cat_num - The category number of the device.
 * @returns {Promise<DeviceLog[]>} A promise that resolves to an array of device logs.
 */
function getDeviceLogs(cat_num) {
    return __awaiter(this, void 0, void 0, function* () {
        const [rows] = yield exports.pool.query(`SELECT * FROM deviceLogs WHERE cat_num = ?`, [cat_num]);
        return rows;
    });
}
/**
 * Retrieves the last log entry for a device.
 * @param {string} cat_num - The category number of the device.
 * @returns {Promise<DeviceLog | undefined>} A promise that resolves to the last device log or undefined if not found.
 */
function getLastDeviceLog(cat_num) {
    return __awaiter(this, void 0, void 0, function* () {
        const [rows] = yield exports.pool.query(`SELECT * FROM deviceLogs WHERE cat_num = ? ORDER BY log_date DESC LIMIT 1`, [cat_num]);
        return rows[0];
    });
}
/**
 * Updates the socket ID associated with a user.
 * @param {number} user_id - The unique identifier of the user.
 * @param {string | null} socket_id - The new socket identifier (or null to clear).
 * @returns {Promise<User | undefined>} A promise that resolves to the updated user or undefined if not found.
 */
function updateUserSocketId(user_id, socket_id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exports.pool.query(`UPDATE users SET socket_id = ? WHERE user_id = ?`, [socket_id, user_id]);
        return getUserById(user_id);
    });
}
/**
 * Retrieves a user by their socket ID.
 * @param {string} socket_id - The socket identifier of the user.
 * @returns {Promise<User | undefined>} A promise that resolves to the user or undefined if not found.
 */
function getUserBySocket(socket_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const [rows] = yield exports.pool.query(`SELECT * FROM users WHERE socket_id = ?`, [socket_id]);
        return rows[0];
    });
}
/**
 * Retrieves a device by its category number.
 * @param {string} cat_num - The category number of the device.
 * @returns {Promise<Device | undefined>} A promise that resolves to the device or undefined if not found.
 */
function getDevice(cat_num) {
    return __awaiter(this, void 0, void 0, function* () {
        const [rows] = yield exports.pool.query(`SELECT * FROM devices WHERE cat_num = ?`, [cat_num]);
        return rows[0];
    });
}
/**
 * Retrieves a device by its thing name.
 * @param {string} thingName - The thing name of the device.
 * @returns {Promise<Device | undefined>} A promise that resolves to the device or undefined if not found.
 */
function getDeviceThing(thingName) {
    return __awaiter(this, void 0, void 0, function* () {
        const [rows] = yield exports.pool.query(`SELECT * FROM devices WHERE thing_name = ?`, [thingName]);
        return rows[0];
    });
}
/**
 * Updates the presence connection status for a device.
 * @param {number} device_id - The unique identifier of the device.
 * @param {boolean} presenceConnection - The new presence connection status.
 * @returns {Promise<Device | undefined>} A promise that resolves to the updated device or undefined if not found.
 */
function updatePresenceConnection(device_id, presenceConnection) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exports.pool.query(`UPDATE devices SET presence_connection = ? WHERE device_id = ?`, [presenceConnection, device_id]);
        return getUserDevice(device_id);
    });
}
