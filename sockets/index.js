import { Server } from 'socket.io';

let io;
const connectedUsers = new Map();

function initSocket(server) {

  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

}

function connectSocket() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized.');
  }
  
  io.on('connection', (socket) => {
  
    socket.on('addUser', async (user_id, callback) => {
      try {
        connectedUsers.set(user_id, socket.id);
        socket.join(user_id); 
        callback({ error: false, user_id: user_id });
      } catch (error) {
        callback({ error: true, message: error.message });
      }
    });
  
    socket.on('removeUser', async (user_id, callback) => {
      try {
        if (connectedUsers.has(user_id)) {
          connectedUsers.delete(user_id);
          callback({ error: false, message: `User ${user_id} removed from connected users`});
        } else {
          callback({ error: true, message: `User ${user_id} removed from connected users`});
        }      
      } catch (error) {
        callback({ error: true, message: error.message });
      }
    });
    
    socket.on('disconnect', () => {
      let userIdToRemove = null;
      for (const [user_id, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          userIdToRemove = user_id;
          break;
        }
      }
      
      if (userIdToRemove) {
        connectedUsers.delete(userIdToRemove);
      }
    });
  });

}

function getIo() {
    if (!io) {
        throw new Error('Socket.IO has not been initialized.');
    }
    return io;
}

function emitToUser(userId, eventName, data) {
  if (!io) {
    throw new Error('Socket.IO has not been initialized.');
  }

  const socketId = connectedUsers[userId];
  if (socketId) {
    io.to(socketId).emit(eventName, data);
  } else {
    throw new Error(`User ${userId} is not connected`);
  }
}

export {initSocket, connectSocket, getIo, emitToUser};