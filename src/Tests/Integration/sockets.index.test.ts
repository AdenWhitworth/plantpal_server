import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import io from 'socket.io-client';
import { getUserById, updateUserSocketId, getUserBySocket } from '../../MySQL/database';
import { verifyToken } from '../../Helper/jwtManager';
import { handleSocketCallback } from '../../Helper/callbackManager';
import { initSocket, getIo, emitToUser, validateAccessToken, handleAddUser, handleRemoveUser, handleCheckSocket, connectSocket, handleDisconnect } from '../../sockets/index';
import { TestSocket, AccessTokenSocket } from '../../Types/types';

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

const httpServer = createServer();
const mockIo = new Server(httpServer);

let clientSocket: any;

const testSocket: TestSocket = {
    user_id: 1,
    socket_id: 'socketId',
    validToken: 'validtoken',
    invalidToken: 'invalidtoken',
};

beforeAll((done) => {
    initSocket(mockIo);
    connectSocket();
    httpServer.listen(3000, () => {
        clientSocket = io(`http://localhost:${3000}`);
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
        const ioInstance = getIo();
        expect(ioInstance).toBeInstanceOf(Server);
        expect(ioInstance.sockets).toBeDefined();
    });

    /**
     * Test case to validate access token successfully.
     * It verifies that the token is validated and the user_id is set, and the next middleware function is called without errors.
     */
    test('should validate access token successfully', async () => {
        (verifyToken as jest.Mock).mockReturnValue({ user_id: testSocket.user_id });
        
        const socket = {
            handshake: {
                auth: { token: `Bearer ${testSocket.validToken}` }
            },
            disconnect: jest.fn(),
        } as unknown as AccessTokenSocket;

        const next = jest.fn();
        
        await validateAccessToken(socket, next);

        expect(socket.user_id).toBe(testSocket.user_id);
        expect(next).toHaveBeenCalledWith();
        socket.disconnect();
    });

    /**
     * Test case for invalid access token validation.
     * It verifies that an invalid token causes the middleware to return an error and user_id is not set.
     */
    test('should fail to validate access token due to invalid token', async () => {
        const socket = {
            handshake: {
                auth: { token: `Bearer ${testSocket.invalidToken}` }
            },
            disconnect: jest.fn(),
        } as unknown as AccessTokenSocket;
        const next = jest.fn();

        (verifyToken as jest.Mock).mockImplementation(() => { throw new Error(); });
        
        await validateAccessToken(socket, next);

        expect(socket.user_id).toBeUndefined();
        expect(next).toHaveBeenCalledWith(expect.any(Error));
        socket.disconnect();
    });

    /**
     * Test case to handle the 'addUser' event.
     * It checks if the socket joins the room and the `handleSocketCallback` function is called to notify that the user has been added.
     */
    test('should handle addUser event', async () => {
        (getUserById as jest.Mock).mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });
        (updateUserSocketId as jest.Mock).mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });


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
        } as unknown as AccessTokenSocket;

        handleAddUser(socket);

        await new Promise(process.nextTick);

        expect(socket.join).toHaveBeenCalledWith(`${testSocket.user_id}`);
        expect(handleSocketCallback).toHaveBeenCalledWith(callback, false, `User ${testSocket.user_id} added`, testSocket.user_id);
    });

    /**
     * Test case to handle the 'removeUser' event.
     * It checks if the user is removed from connected users and the `handleSocketCallback` function is called to notify the removal.
     */
    test('should handle removeUser event', async () => {
        (getUserById as jest.Mock).mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });
        (updateUserSocketId as jest.Mock).mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });

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
        } as unknown as AccessTokenSocket;

        handleRemoveUser(socket);

        await new Promise(process.nextTick);

        expect(handleSocketCallback).toHaveBeenCalledWith(callback, false, `User ${testSocket.user_id} removed from connected users`, testSocket.user_id);
    });

    /**
     * Test case to handle the 'checkSocket' event where the socket needs to be updated.
     * It verifies that the socket is updated and the `handleSocketCallback` function is called to indicate success.
     */
    test('should handle checkSocket event which updates', async () => {
        (getUserById as jest.Mock).mockResolvedValue({ user_id: testSocket.user_id, socket_id: null });
        (updateUserSocketId as jest.Mock).mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });

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
        } as unknown as AccessTokenSocket;

        handleCheckSocket(socket);

        await new Promise(process.nextTick);

        expect(handleSocketCallback).toHaveBeenCalledWith(callback, false, "Socket was updated");
    });

    /**
     * Test case to handle the 'checkSocket' event where the user is not found.
     * It verifies that the `handleSocketCallback` function is called to indicate that the user does not exist.
     */
    test('should handle checkSocket event which doesnt find a user', async () => {
        (getUserById as jest.Mock).mockResolvedValue(null);
        (handleSocketCallback as jest.Mock)

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
        } as unknown as AccessTokenSocket;

        handleCheckSocket(socket);

        await new Promise(process.nextTick);

        expect(handleSocketCallback).toHaveBeenCalledWith(callback, true, "User does not exist");
    });

    /**
     * Test case to handle the 'checkSocket' event where the socket is already up to date.
     * It verifies that the `handleSocketCallback` function is called to indicate that the socket is already up to date.
     */
    test('should handle checkSocket event which is already up to date', async () => {
        (getUserById as jest.Mock).mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });
        (updateUserSocketId as jest.Mock).mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });
        (handleSocketCallback as jest.Mock);

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
        } as unknown as AccessTokenSocket;

        handleCheckSocket(socket);

        await new Promise(process.nextTick);

        expect(handleSocketCallback).toHaveBeenCalledWith(callback, false, "Socket is up to date");
    });

    /**
     * Test case to handle emitting events to a user.
     * It verifies that the event is emitted to the correct user and the expected data is received by the client.
     */
    test('should handle emitToUser function', async () => {
        (getUserById as jest.Mock).mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });
        const eventName = 'testEvent';
        const data = { data: "test" };

        clientSocket.on(eventName, (receivedData: any) => {
            expect(receivedData).toEqual(data);
        });

        await emitToUser(testSocket.user_id, eventName, data);
    });

    /**
     * Test case for handling errors in the `emitToUser` function.
     * It verifies that an error is thrown when attempting to emit to a non-existing user.
     */
    test('should handle emitToUser function error', async () => {
        (getUserById as jest.Mock).mockResolvedValue(null);
        const eventName = 'testEvent';
        const data = { data: "test" };

        try {
            await emitToUser(testSocket.user_id, eventName, data);
        } catch (error) {
            const err = error as Error;
            expect(err).toBeDefined();
            expect(err.message).toBe(`Error emitting to user ${testSocket.user_id}`);
        }
    });

    /**
     * Test case to handle the 'disconnect' event.
     * It verifies that the user is removed from the connected users and the `updateUserSocketId` function is called to nullify the user's socket ID in the database.
     */
    test('should handle disconnect event', async () => {
        (getUserBySocket as jest.Mock).mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });
        (updateUserSocketId as jest.Mock)

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
        } as unknown as AccessTokenSocket;

        handleDisconnect(socket);

        await new Promise(process.nextTick);

        expect(updateUserSocketId).toHaveBeenCalledWith(testSocket.user_id, null);
    });

    /**
     * Test case to handle the 'disconnect' event when there is an error updating the database.
     * It verifies that the `updateUserSocketId` function is not called if the user is not found.
     */
    test('should handle disconnect event update socket database error', async () => {
        (getUserBySocket as jest.Mock).mockResolvedValue(null);

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
        } as unknown as AccessTokenSocket;

        handleDisconnect(socket);

        await new Promise(process.nextTick);

        expect(updateUserSocketId).not.toHaveBeenCalled();
    });
});
