import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import io from 'socket.io-client';
import { getUserById, updateUserSocketId, getUserBySocket } from '../../MySQL/database';
import { verifyToken } from '../../Helper/jwtManager';
import { handleSocketCallback } from '../../Helper/callbackManager';
import { initSocket, getIo, emitToUser, validateAccessToken, handleAddUser, handleRemoveUser, handleCheckSocket, connectSocket, handleDisconnect } from '../../sockets/index';

jest.mock('../../MySQL/database', () => ({
    getUserById: jest.fn(),
    updateUserSocketId: jest.fn(),
    getUserBySocket: jest.fn(),
}));

jest.mock('../../Helper/jwtManager', () => ({
    verifyToken: jest.fn(),
}));

jest.mock('../../Helper/callbackManager', () => ({
    handleSocketCallback: jest.fn(),
    CallbackResponse: jest.fn(),
    extractErrorMessage: jest.fn(),
}));

const httpServer = createServer();
const mockIo = new Server(httpServer);

let clientSocket: any;

const testSocket = {
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

interface AccessTokenSocket extends Socket {
    user_id?: number;
}

describe('Socket.io Integration', () => {
    test('should initialize socket server', () => {
        const ioInstance = getIo();
        expect(ioInstance).toBeInstanceOf(Server);
        expect(ioInstance.sockets).toBeDefined();
    });

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

    test('should handle emitToUser function', async () => {
        (getUserById as jest.Mock).mockResolvedValue({ user_id: testSocket.user_id, socket_id: testSocket.socket_id });
        const eventName = 'testEvent';
        const data = { data: "test" };

        clientSocket.on(eventName, (receivedData: any) => {
            expect(receivedData).toEqual(data);
        });

        await emitToUser(testSocket.user_id, eventName, data);
    });

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
