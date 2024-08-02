import { Server } from 'socket.io';
import { getUserById, updateUserSocketId, getUserBySocket } from '../MySQL/database.js';
import jwt from 'jsonwebtoken';

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
}

const validateToken = async (socket, next) => {

  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  if (token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  }
  
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
          return next(new Error('Authentication error'));
      }
      socket.user = decoded;
      next();
  });

};

function connectSocket() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized.');
  }

  io.use((socket, next) => {
    validateToken(socket, next);
  });
  
  io.on('connection', (socket) => {

    handleAddUser(socket);
    handleRemoveUser(socket);
    handleDisconnect(socket);
    handleCheckSocket(socket);
    
  });
}

function handleAddUser(socket) {
  socket.on('addUser', async (user_id, callback) => {
    try {
      let user = await getUserById(user_id);

      if (!user) {
        throw new Error('User does not exist');
      }
      
      if (user.socket_id !== socket.id) {
        user = await updateUserSocketId(user_id, socket.id);
      }

      socket.join(user_id);
      callback({ error: false, user_id: user_id });
    } catch (error) {
      callback({ error: true, message: error.message });
    }
  });
}

function handleRemoveUser(socket) {
  socket.on('removeUser', async (user_id, callback) => {
    try {
      let user = await getUserById(user_id);

      if (!user) {
        throw new Error('User does not exist');
      }

      if (user.socket_id !== null) {
        await updateUserSocketId(user_id, null);
      }
      
      callback({ error: false, message: `User ${user_id} removed from connected users`});
    } catch (error) {
      callback({ error: true, message: error.message });
    }
  });
}

function handleDisconnect(socket) {
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

function handleCheckSocket(socket) {
  socket.on('checkSocket', async (user_id, callback) => {
    try {
      let user = await getUserById(user_id);

      if (!user) {
        callback({ error: true, message: 'User does not exist' });
        return;
      }
      
      if (user.socket_id !== socket.id) {
        await updateUserSocketId(user_id, socket.id);
        callback({ error: false, message: 'Socket was updated' });
        return;
      }

      callback({ error: false, message: 'Socket is up to date' });
    } catch (error) {
      callback({ error: true, message: error.message });
    }
  });
}

function getIo() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized.');
  }
  return io;
}

async function emitToUser(user_id, eventName, data) {
  if (!io) {
    throw new Error('Socket.IO has not been initialized.');
  }

  try {
    let user = await getUserById(user_id);

    if (!user || user.socket_id === null) {
      throw new Error(`User ${user_id} is not connected`);
    }

    io.to(user.socket_id).emit(eventName, data);
  } catch (error) {
    console.error(`Error emitting to user ${user_id}:`, error);
  }
}

export { initSocket, connectSocket, getIo, emitToUser };