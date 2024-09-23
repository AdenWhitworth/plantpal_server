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
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const database_1 = require("../../MySQL/database");
const jwtManager_1 = require("../../Helper/jwtManager");
const callbackManager_1 = require("../../Helper/callbackManager");
const index_1 = require("../../sockets/index");
/**
 * Mocking the database.
 */
jest.mock('../../MySQL/database', () => ({
    getUserById: jest.fn(),
    updateUserSocketId: jest.fn(),
    getUserBySocket: jest.fn(),
}));
/**
 * Mocking the jwtManager.
 */
jest.mock('../../Helper/jwtManager', () => ({
    verifyToken: jest.fn(),
}));
/**
 * Mocking the callbackManager.
 */
jest.mock('../../Helper/callbackManager', () => ({
    handleSocketCallback: jest.fn(),
    CallbackResponse: jest.fn(),
    extractErrorMessage: jest.fn(),
}));
const httpServer = (0, http_1.createServer)();
const mockIo = new socket_io_1.Server(httpServer);
let clientSocket;
const testSocket = {
    user_id: 1,
    socket_id: 'socketId',
    validToken: 'validtoken',
    invalidToken: 'invalidtoken',
};
beforeAll((done) => {
    (0, index_1.initSocket)(mockIo);
    (0, index_1.connectSocket)();
    httpServer.listen(3000, () => {
        clientSocket = (0, socket_io_client_1.default)(`http://localhost:${3000}`);
        done();
    });
});
beforeEach(() => {
    jest.clearAllMocks();
});
afterAll(done => {
    clientSocket.close();
    httpServer.close(done);
});
/**
 * Integration tests for the Express application.
 * Tests socket initialization and various socket endpoints behavior.
 */
describe('Socket.io Integration', () => {
    /**
     * Test case to initialize the socket server.
     * It verifies that the server is an instance of the socket.io `Server` and that the `sockets` object is defined.
     */
    test('should initialize socket server', () => {
        const ioInstance = (0, index_1.getIo)();
        expect(ioInstance).toBeInstanceOf(socket_io_1.Server);
        expect(ioInstance.sockets).toBeDefined();
    });
    /**
     * Test case to validate access token successfully.
     * It verifies that the token is validated and the user_id is set, and the next middleware function is called without errors.
     */
    test('should validate access token successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        jwtManager_1.verifyToken.mockReturnValue({ user_id: testSocket.user_id });
        const socket = {
            handshake: {
                auth: { token: `Bearer ${testSocket.validToken}` }
            },
            disconnect: jest.fn(),
        };
        const next = jest.fn();
        yield (0, index_1.validateAccessToken)(socket, next);
        expect(socket.user_id).toBe(testSocket.user_id);
        expect(next).toHaveBeenCalledWith();
        socket.disconnect();
    }));
    /**
     * Test case for invalid access token validation.
     * It verifies that an invalid token causes the middleware to return an error and user_id is not set.
     */
    test('should fail to validate access token due to invalid token', () => __awaiter(void 0, void 0, void 0, function* () {
        const socket = {
            handshake: {
                auth: { token: `Bearer ${testSocket.invalidToken}` }
            },
            disconnect: jest.fn(),
        };
        const next = jest.fn();
        jwtManager_1.verifyToken.mockImplementation(() => { throw new Error(); });
        yield (0, index_1.validateAccessToken)(socket, next);
        expect(socket.user_id).toBeUndefined();
        expect(next).toHaveBeenCalledWith(expect.any(Error));
        socket.disconnect();
    }));
    /**
     * Test case to handle the 'addUser' event.
     * It checks if the socket joins the room and the `handleSocketCallback` function is called to notify that the user has been added.
     */
    test('should handle addUser event', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserById.mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });
        database_1.updateUserSocketId.mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });
        const callback = jest.fn();
        const socket = {
            handshake: {
                auth: { token: `Bearer ${testSocket.invalidToken}` }
            },
            disconnect: jest.fn(),
            id: 'socketId',
            join: jest.fn(),
            on: jest.fn((event, handler) => {
                if (event === 'addUser') {
                    handler(testSocket.user_id, callback);
                }
            }),
            nsp: {},
            client: {},
        };
        (0, index_1.handleAddUser)(socket);
        yield new Promise(process.nextTick);
        expect(socket.join).toHaveBeenCalledWith(`${testSocket.user_id}`);
        expect(callbackManager_1.handleSocketCallback).toHaveBeenCalledWith(callback, false, `User ${testSocket.user_id} added`, testSocket.user_id);
    }));
    /**
     * Test case to handle the 'removeUser' event.
     * It checks if the user is removed from connected users and the `handleSocketCallback` function is called to notify the removal.
     */
    test('should handle removeUser event', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserById.mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });
        database_1.updateUserSocketId.mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });
        const callback = jest.fn();
        const socket = {
            handshake: {
                auth: { token: `Bearer ${testSocket.invalidToken}` }
            },
            disconnect: jest.fn(),
            id: 'socketId',
            join: jest.fn(),
            on: jest.fn((event, handler) => {
                if (event === 'removeUser') {
                    handler(testSocket.user_id, callback);
                }
            }),
            nsp: {},
            client: {},
        };
        (0, index_1.handleRemoveUser)(socket);
        yield new Promise(process.nextTick);
        expect(callbackManager_1.handleSocketCallback).toHaveBeenCalledWith(callback, false, `User ${testSocket.user_id} removed from connected users`, testSocket.user_id);
    }));
    /**
     * Test case to handle the 'checkSocket' event where the socket needs to be updated.
     * It verifies that the socket is updated and the `handleSocketCallback` function is called to indicate success.
     */
    test('should handle checkSocket event which updates', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserById.mockResolvedValue({ user_id: testSocket.user_id, socket_id: null });
        database_1.updateUserSocketId.mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });
        const callback = jest.fn();
        const socket = {
            handshake: {
                auth: { token: `Bearer ${testSocket.invalidToken}` }
            },
            disconnect: jest.fn(),
            id: 'socketId',
            join: jest.fn(),
            on: jest.fn((event, handler) => {
                if (event === 'checkSocket') {
                    handler(testSocket.user_id, callback);
                }
            }),
            nsp: {},
            client: {},
        };
        (0, index_1.handleCheckSocket)(socket);
        yield new Promise(process.nextTick);
        expect(callbackManager_1.handleSocketCallback).toHaveBeenCalledWith(callback, false, "Socket was updated");
    }));
    /**
     * Test case to handle the 'checkSocket' event where the user is not found.
     * It verifies that the `handleSocketCallback` function is called to indicate that the user does not exist.
     */
    test('should handle checkSocket event which doesnt find a user', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserById.mockResolvedValue(null);
        callbackManager_1.handleSocketCallback;
        const callback = jest.fn();
        const socket = {
            handshake: {
                auth: { token: `Bearer ${testSocket.invalidToken}` }
            },
            disconnect: jest.fn(),
            id: 'socketId',
            join: jest.fn(),
            on: jest.fn((event, handler) => {
                if (event === 'checkSocket') {
                    handler(testSocket.user_id, callback);
                }
            }),
            nsp: {},
            client: {},
        };
        (0, index_1.handleCheckSocket)(socket);
        yield new Promise(process.nextTick);
        expect(callbackManager_1.handleSocketCallback).toHaveBeenCalledWith(callback, true, "User does not exist");
    }));
    /**
     * Test case to handle the 'checkSocket' event where the socket is already up to date.
     * It verifies that the `handleSocketCallback` function is called to indicate that the socket is already up to date.
     */
    test('should handle checkSocket event which is already up to date', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserById.mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });
        database_1.updateUserSocketId.mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });
        callbackManager_1.handleSocketCallback;
        const callback = jest.fn();
        const socket = {
            handshake: {
                auth: { token: `Bearer ${testSocket.invalidToken}` }
            },
            disconnect: jest.fn(),
            id: 'socketId',
            join: jest.fn(),
            on: jest.fn((event, handler) => {
                if (event === 'checkSocket') {
                    handler(testSocket.user_id, callback);
                }
            }),
            nsp: {},
            client: {},
        };
        (0, index_1.handleCheckSocket)(socket);
        yield new Promise(process.nextTick);
        expect(callbackManager_1.handleSocketCallback).toHaveBeenCalledWith(callback, false, "Socket is up to date");
    }));
    /**
     * Test case to handle emitting events to a user.
     * It verifies that the event is emitted to the correct user and the expected data is received by the client.
     */
    test('should handle emitToUser function', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserById.mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });
        const eventName = 'testEvent';
        const data = { data: "test" };
        clientSocket.on(eventName, (receivedData) => {
            expect(receivedData).toEqual(data);
        });
        yield (0, index_1.emitToUser)(testSocket.user_id, eventName, data);
    }));
    /**
     * Test case for handling errors in the `emitToUser` function.
     * It verifies that an error is thrown when attempting to emit to a non-existing user.
     */
    test('should handle emitToUser function error', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserById.mockResolvedValue(null);
        const eventName = 'testEvent';
        const data = { data: "test" };
        try {
            yield (0, index_1.emitToUser)(testSocket.user_id, eventName, data);
        }
        catch (error) {
            const err = error;
            expect(err).toBeDefined();
            expect(err.message).toBe(`Error emitting to user ${testSocket.user_id}`);
        }
    }));
    /**
     * Test case to handle the 'disconnect' event.
     * It verifies that the user is removed from the connected users and the `updateUserSocketId` function is called to nullify the user's socket ID in the database.
     */
    test('should handle disconnect event', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserBySocket.mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });
        database_1.updateUserSocketId;
        const callback = jest.fn();
        const socket = {
            handshake: {
                auth: { token: `Bearer ${testSocket.invalidToken}` }
            },
            disconnect: jest.fn(),
            id: 'socketId',
            join: jest.fn(),
            on: jest.fn((event, handler) => {
                if (event === 'disconnect') {
                    handler(testSocket.user_id, callback);
                }
            }),
            nsp: {},
            client: {},
        };
        (0, index_1.handleDisconnect)(socket);
        yield new Promise(process.nextTick);
        expect(database_1.updateUserSocketId).toHaveBeenCalledWith(testSocket.user_id, null);
    }));
    /**
     * Test case to handle the 'disconnect' event when there is an error updating the database.
     * It verifies that the `updateUserSocketId` function is not called if the user is not found.
     */
    test('should handle disconnect event update socket database error', () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.getUserBySocket.mockResolvedValue(null);
        const callback = jest.fn();
        const socket = {
            handshake: {
                auth: { token: `Bearer ${testSocket.invalidToken}` }
            },
            disconnect: jest.fn(),
            id: 'socketId',
            join: jest.fn(),
            on: jest.fn((event, handler) => {
                if (event === 'disconnect') {
                    handler(testSocket.user_id, callback);
                }
            }),
            nsp: {},
            client: {},
        };
        (0, index_1.handleDisconnect)(socket);
        yield new Promise(process.nextTick);
        expect(database_1.updateUserSocketId).not.toHaveBeenCalled();
    }));
});
