import { Server, Socket } from 'socket.io';
import { getUserById, updateUserSocketId, getUserBySocket } from '../MySQL/database';
import { JwtPayload } from 'jsonwebtoken';
import { verifyToken } from '../Helper/jwtManager';
import { handleSocketCallback, extractErrorMessage } from '../Helper/callbackManager';
import { CallbackResponse, AccessTokenSocket } from '../Types/types';

let io: Server;

/**
 * Initializes the Socket.IO server with the given HTTP server.
 *
 * @param {any} server - The HTTP server to attach Socket.IO to.
 * @returns {void}
 */
function initSocket(server: any): void {
  io = new Server(server, {
    cors: {
      origin: [process.env.BASE_URL as string, process.env.BASE_URL_WWW as string],
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
const validateAccessToken = async (socket: AccessTokenSocket, next: (err?: Error) => void): Promise<void> => {

  const authHeader = socket.handshake.auth.token;
  
  if (!authHeader) {
    return next(new Error('Please provide the access token.'));
  }

  let accessToken;

  if (authHeader.startsWith('Bearer')){
    accessToken = authHeader.split(' ')[1];
  } else {
    accessToken = authHeader
  }
  
  try {
    const decoded = verifyToken(accessToken, process.env.AUTH_ACCESS_TOKEN_SECRET as string);
    if (typeof decoded === 'object' && 'user_id' in decoded) {
        socket.user_id = (decoded as JwtPayload).user_id as number;
        next();
    } else {
      return next(new Error('Please provide the access token.'));
    }
      
  } catch (error) {
    return next(new Error('Please provide the access token.'));
  }

};

/**
 * Establishes the connection for Socket.IO, setting up middleware and event listeners.
 *
 * @returns {void}
 * @throws {Error} If Socket.IO has not been initialized.
 */
function connectSocket(): void {
  if (!io) {
    throw new Error('Socket.IO has not been initialized.');
  }

  io.use((socket: AccessTokenSocket, next: (err?: Error) => void) => {
    validateAccessToken(socket, next);
  });
  
  io.on('connection', (socket: AccessTokenSocket) => {

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
function handleAddUser(socket: AccessTokenSocket): void {
  socket.on('addUser', async (user_id: number, callback: (response: CallbackResponse) => void) => {
    try {
      let user = await getUserById(user_id);

      if (!user) {
        throw new Error('User does not exist');
      }
      
      if (user.socket_id !== socket.id) {
        user = await updateUserSocketId(user_id, socket.id);
      }

      socket.join(user_id.toString());
      handleSocketCallback(callback, false, `User ${user_id} added`, user_id);
    } catch (error) {
      handleSocketCallback(callback, true, extractErrorMessage(error));
    }
  });
}

/**
 * Handles the 'removeUser' event to remove a user from the connected users list.
 *
 * @param {AccessTokenSocket} socket - The socket connection.
 * @returns {void}
 */
function handleRemoveUser(socket: AccessTokenSocket): void {
  socket.on('removeUser', async (user_id: number, callback: (response: CallbackResponse) => void) => {
    try {
      let user = await getUserById(user_id);

      if (!user) {
        throw new Error('User does not exist');
      }

      if (user.socket_id !== null) {
        await updateUserSocketId(user_id, null);
      }
      
      handleSocketCallback(callback, false, `User ${user_id} removed from connected users`, user_id);
    } catch (error) {
      handleSocketCallback(callback, true, extractErrorMessage(error));
    }
  });
}

/**
 * Handles the 'disconnect' event for cleaning up user socket information.
 *
 * @param {AccessTokenSocket} socket - The socket connection.
 * @returns {void}
 */
function handleDisconnect(socket: AccessTokenSocket): void {
  socket.on('disconnect', async () => {
    try {
      let user = await getUserBySocket(socket.id);
      
      if (user) {
        await updateUserSocketId(user.user_id, null);
      }
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  });
}

/**
 * Handles the 'checkSocket' event to check and update a user's socket information.
 *
 * @param {AccessTokenSocket} socket - The socket connection.
 * @returns {void}
 */
function handleCheckSocket(socket: AccessTokenSocket): void {
  socket.on('checkSocket', async (user_id: number, callback: (response: CallbackResponse) => void) => {
    try {
      let user = await getUserById(user_id);

      if (!user) {
        handleSocketCallback(callback, true, "User does not exist");
        return;
      }
      
      if (user.socket_id !== socket.id) {
        await updateUserSocketId(user_id, socket.id);
        handleSocketCallback(callback, false, "Socket was updated");
        return;
      }

      handleSocketCallback(callback, false, "Socket is up to date");
    } catch (error) {
      handleSocketCallback(callback, true, extractErrorMessage(error));
    }
  });
}

/**
 * Retrieves the Socket.IO instance.
 *
 * @returns {Server} The Socket.IO server instance.
 * @throws {Error} If Socket.IO has not been initialized.
 */
function getIo(): Server {
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
async function emitToUser(user_id: number, eventName: string, data: any): Promise<void> {
  if (!io) {
    throw new Error('Socket.IO has not been initialized.');
  }

  try {
    const user = await getUserById(user_id);

    if (!user || !user.socket_id) {
      throw new Error(`User ${user_id} is not connected`);
    }
    
    io.to(user.socket_id).emit(eventName, data);
  } catch (error) {
    throw new Error(`Error emitting to user ${user_id}`);
  }
}

export { initSocket, connectSocket, getIo, emitToUser, validateAccessToken, handleAddUser, handleRemoveUser, handleCheckSocket, handleDisconnect };