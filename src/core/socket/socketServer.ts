import { Server as HttpServer } from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import { UserModel } from '../../models/userModel';
import { logger } from '../../utils/logger';

let io: IOServer | null = null;

enum SocketMessageEnum {
  REGISTER = 'register',
  INCOMING_MESSAGE = 'incoming_message',
  OUTGOING_MESSAGE = 'outgoing_message',
  TYPING = 'typing',
  TYPING_STOP = 'typing_stop',
  DISCONNECT = 'disconnect',
}

/**
 * Initialize the Socket.IO server
 * @param httpServer The HTTP server instance
 */
export function initSocketServer(httpServer: HttpServer) {
  io = new IOServer(httpServer, {
    cors: {
      origin: '*', // Adjust as needed for production
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Expect client to emit 'register' with their userId after connecting
    socket.on(SocketMessageEnum.REGISTER, async (data: { userId: string }) => {
      try {
        const { userId } = data;
        if (!userId) return;
        await UserModel.findByIdAndUpdate(userId, { socketId: socket.id });
        logger.info(`Registered socketId for user ${userId}: ${socket.id}`);
      } catch (err) {
        logger.error('Error registering socketId:', err);
      }
    });

    // Listen for incoming_message from client
    socket.on(
      SocketMessageEnum.INCOMING_MESSAGE,
      async (data: { userId: string; conversationId: string; message: string }) => {
        logger.info(`Received incoming_message: ${JSON.stringify(data)}`);
        // Here you can process/store the message as needed, or emit to other users
        // For now, just echo back to sender as an example
        socket.emit(SocketMessageEnum.OUTGOING_MESSAGE, {
          conversationId: data.conversationId,
          message: data.message,
          sender: data.userId,
        });
      },
    );

    socket.on(SocketMessageEnum.DISCONNECT, async () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      // clear user socketId from user in DB
      try {
        await UserModel.findOneAndUpdate({ socketId: socket.id }, { socketId: null });
      } catch (err) {
        logger.error('Error clearing socketId on disconnect:', err);
      }
    });
  });
}

/**
 * Send a message to a user by userId
 */
export async function sendMessageToUser(userId: string, message: any) {
  if (!io) throw new Error('Socket server not initialized');
  const user = await UserModel.findById(userId).lean();
  if (user && user.socketId) {
    io.to(user.socketId).emit('send_message', message);
    logger.info(`Sent message to user ${userId} via socket ${user.socketId}`);
  } else {
    logger.warn(`User ${userId} not connected or missing socketId`);
  }
}

/**
 * Send a typing notification to a user by userId
 */
export async function sendTypingToUser(userId: string, typingMessage: string) {
  if (!io) throw new Error('Socket server not initialized');
  const user = await UserModel.findById(userId).lean();
  if (user && user.socketId) {
    io.to(user.socketId).emit('typing', { message: typingMessage });
    logger.info(`Sent typing to user ${userId} via socket ${user.socketId}`);
  } else {
    logger.warn(`User ${userId} not connected or missing socketId`);
  }
}
