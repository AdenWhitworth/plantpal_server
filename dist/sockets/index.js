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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAccessToken = void 0;
exports.initSocket = initSocket;
exports.connectSocket = connectSocket;
exports.getIo = getIo;
exports.emitToUser = emitToUser;
exports.handleAddUser = handleAddUser;
exports.handleRemoveUser = handleRemoveUser;
exports.handleCheckSocket = handleCheckSocket;
exports.handleDisconnect = handleDisconnect;
const socket_io_1 = require("socket.io");
const database_1 = require("../MySQL/database");
const jwtManager_1 = require("../Helper/jwtManager");
const callbackManager_1 = require("../Helper/callbackManager");
let io;
/**
 * Initializes the Socket.IO server with the given HTTP server.
 *
 * @param {any} server - The HTTP server to attach Socket.IO to.
 * @returns {void}
 */
function initSocket(server) {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.BASE_URL,
            methods: ['GET', 'POST'],
            credentials: true,
        }
    });
}
/**
 * Validates the access token provided in the socket handshake.
 *
 * @param {AccessTokenSocket} socket - The socket connection.
 * @param {function} next - The callback function to call after validation.
 * @returns {Promise<void>}
 * @throws {Error} If the access token is invalid or not provided.
 */
const validateAccessToken = (socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = socket.handshake.auth.token;
    if (!authHeader) {
        return next(new Error('Please provide the access token.'));
    }
    let accessToken;
    if (authHeader.startsWith('Bearer')) {
        accessToken = authHeader.split(' ')[1];
    }
    else {
        accessToken = authHeader;
    }
    try {
        const decoded = (0, jwtManager_1.verifyToken)(accessToken, process.env.AUTH_ACCESS_TOKEN_SECRET);
        if (typeof decoded === 'object' && 'user_id' in decoded) {
            socket.user_id = decoded.user_id;
            next();
        }
        else {
            return next(new Error('Please provide the access token.'));
        }
    }
    catch (error) {
        return next(new Error('Please provide the access token.'));
    }
});
exports.validateAccessToken = validateAccessToken;
/**
 * Establishes the connection for Socket.IO, setting up middleware and event listeners.
 *
 * @returns {void}
 * @throws {Error} If Socket.IO has not been initialized.
 */
function connectSocket() {
    if (!io) {
        throw new Error('Socket.IO has not been initialized.');
    }
    io.use((socket, next) => {
        validateAccessToken(socket, next);
    });
    io.on('connection', (socket) => {
        handleAddUser(socket);
        handleRemoveUser(socket);
        handleDisconnect(socket);
        handleCheckSocket(socket);
    });
}
/**
 * Handles the 'addUser' event to add a user to a room and update their socket ID.
 *
 * @param {AccessTokenSocket} socket - The socket connection.
 * @returns {void}
 */
function handleAddUser(socket) {
    socket.on('addUser', (user_id, callback) => __awaiter(this, void 0, void 0, function* () {
        try {
            let user = yield (0, database_1.getUserById)(user_id);
            if (!user) {
                throw new Error('User does not exist');
            }
            if (user.socket_id !== socket.id) {
                user = yield (0, database_1.updateUserSocketId)(user_id, socket.id);
            }
            socket.join(user_id.toString());
            (0, callbackManager_1.handleSocketCallback)(callback, false, `User ${user_id} added`, user_id);
        }
        catch (error) {
            (0, callbackManager_1.handleSocketCallback)(callback, true, (0, callbackManager_1.extractErrorMessage)(error));
        }
    }));
}
/**
 * Handles the 'removeUser' event to remove a user from the connected users list.
 *
 * @param {AccessTokenSocket} socket - The socket connection.
 * @returns {void}
 */
function handleRemoveUser(socket) {
    socket.on('removeUser', (user_id, callback) => __awaiter(this, void 0, void 0, function* () {
        try {
            let user = yield (0, database_1.getUserById)(user_id);
            if (!user) {
                throw new Error('User does not exist');
            }
            if (user.socket_id !== null) {
                yield (0, database_1.updateUserSocketId)(user_id, null);
            }
            (0, callbackManager_1.handleSocketCallback)(callback, false, `User ${user_id} removed from connected users`, user_id);
        }
        catch (error) {
            (0, callbackManager_1.handleSocketCallback)(callback, true, (0, callbackManager_1.extractErrorMessage)(error));
        }
    }));
}
/**
 * Handles the 'disconnect' event for cleaning up user socket information.
 *
 * @param {AccessTokenSocket} socket - The socket connection.
 * @returns {void}
 */
function handleDisconnect(socket) {
    socket.on('disconnect', () => __awaiter(this, void 0, void 0, function* () {
        try {
            let user = yield (0, database_1.getUserBySocket)(socket.id);
            if (user) {
                yield (0, database_1.updateUserSocketId)(user.user_id, null);
            }
        }
        catch (error) {
            console.error('Error during disconnect:', error);
        }
    }));
}
/**
 * Handles the 'checkSocket' event to check and update a user's socket information.
 *
 * @param {AccessTokenSocket} socket - The socket connection.
 * @returns {void}
 */
function handleCheckSocket(socket) {
    socket.on('checkSocket', (user_id, callback) => __awaiter(this, void 0, void 0, function* () {
        try {
            let user = yield (0, database_1.getUserById)(user_id);
            if (!user) {
                (0, callbackManager_1.handleSocketCallback)(callback, true, "User does not exist");
                return;
            }
            if (user.socket_id !== socket.id) {
                yield (0, database_1.updateUserSocketId)(user_id, socket.id);
                (0, callbackManager_1.handleSocketCallback)(callback, false, "Socket was updated");
                return;
            }
            (0, callbackManager_1.handleSocketCallback)(callback, false, "Socket is up to date");
        }
        catch (error) {
            (0, callbackManager_1.handleSocketCallback)(callback, true, (0, callbackManager_1.extractErrorMessage)(error));
        }
    }));
}
/**
 * Retrieves the Socket.IO instance.
 *
 * @returns {Server} The Socket.IO server instance.
 * @throws {Error} If Socket.IO has not been initialized.
 */
function getIo() {
    if (!io) {
        throw new Error('Socket.IO has not been initialized.');
    }
    return io;
}
/**
 * Emits an event to a user based on their user ID.
 *
 * @param {number} user_id - The ID of the user to emit the event to.
 * @param {string} eventName - The name of the event to emit.
 * @param {any} data - The data to send with the event.
 * @returns {Promise<void>}
 * @throws {Error} If Socket.IO has not been initialized or the user is not connected.
 */
function emitToUser(user_id, eventName, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!io) {
            throw new Error('Socket.IO has not been initialized.');
        }
        try {
            const user = yield (0, database_1.getUserById)(user_id);
            if (!user || !user.socket_id) {
                throw new Error(`User ${user_id} is not connected`);
            }
            io.to(user.socket_id).emit(eventName, data);
        }
        catch (error) {
            throw new Error(`Error emitting to user ${user_id}`);
        }
    });
}
