import { Server, Socket } from 'socket.io';
import { getUserById, updateUserSocketId, getUserBySocket } from '../MySQL/database';
import { JwtPayload } from 'jsonwebtoken';
import { verifyToken } from '../Helper/jwtManager';
import { CallbackResponse, handleSocketCallback, extractErrorMessage } from '../Helper/callbackManager';

let io: Server;

function initSocket(server: any): void {
  io = new Server(server, {
    cors: {
      origin: process.env.BASE_URL as string,
      methods: ['GET', 'POST'],
      credentials: true,
    }
  });
}

interface AccessTokenSocket extends Socket {
  user_id?: number;
}

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

function handleAddUser(socket: AccessTokenSocket) {
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

function handleRemoveUser(socket: AccessTokenSocket) {
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

function handleDisconnect(socket: AccessTokenSocket) {
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

function handleCheckSocket(socket: AccessTokenSocket) {
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

function getIo(): Server {
  if (!io) {
    throw new Error('Socket.IO has not been initialized.');
  }
  return io;
}

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
    console.error(`Error emitting to user ${user_id}:`, error);
  }
}

export { initSocket, connectSocket, getIo, emitToUser };