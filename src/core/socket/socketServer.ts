import { Server as HttpServer } from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import { UserModel } from '../../models/userModel';
import { logger } from '../../utils/logger';
import { conversationService } from '../../services/conversationService';
import { ISendMessagePayload } from '../../types/conversationType';

let io: IOServer | null = null;

enum SocketMessageEnum {
  REGISTER = 'register',
  INCOMING_MESSAGE = 'send_message', // this means a new message came in from client
  OUTGOING_MESSAGE = 'receive_message', // this means a new message is sent to client
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

    // Error handler utility for socket events
    function handleSocketError(socket: Socket, error: any, context?: string) {
      const message = error?.message || (typeof error === 'string' ? error : 'Unknown error');
      if (context) {
        logger.error(`${context}:`, error);
      } else {
        logger.error('Socket error:', error);
      }
      socket.emit('error', { message });
    }

    // Expect client to emit 'register' with their userId after connecting
    socket.on(SocketMessageEnum.REGISTER, async (data: { userId: string }) => {
      try {
        const { userId } = data;
        if (!userId) return;
        await UserModel.findByIdAndUpdate(userId, { socketId: socket.id });
        logger.info(`Registered socketId for user ${userId}: ${socket.id}`);
      } catch (err) {
        handleSocketError(socket, err, 'Error registering socketId');
      }
    });

    // Listen for incoming_message from client
    // TODO: remove this, let user send message from the rest endpoint
    socket.on(
      SocketMessageEnum.INCOMING_MESSAGE,
      async (data: { userId: string; conversationId: string; message: string }) => {
        try {
          logger.info(`Received incoming_message: ${JSON.stringify(data)}`);

          const user = await UserModel.findById(data.userId);
          if (!user) {
            handleSocketError(socket, new Error(`User not found: ${data.userId}`), 'User lookup');
            return;
          }

          // Create the message
          const payload: ISendMessagePayload = {
            conversationId: data.conversationId,
            content: data.message,
          };

          await conversationService.sendMessage(payload, user);

          // The AI reply is handled automatically by sendMessage
        } catch (error) {
          handleSocketError(socket, error, 'Error sending message');
        }
      },
    );

    socket.on(SocketMessageEnum.DISCONNECT, async () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      // clear user socketId from user in DB
      try {
        await UserModel.findOneAndUpdate({ socketId: socket.id }, { socketId: null });
      } catch (err) {
        handleSocketError(socket, err, 'Error clearing socketId on disconnect');
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
    io.to(user.socketId).emit(SocketMessageEnum.OUTGOING_MESSAGE, message);
    logger.info(
      `Sent ${SocketMessageEnum.OUTGOING_MESSAGE} to user ${userId} via socket ${user.socketId}`,
    );
    return true;
  } else {
    logger.warn(`User ${userId} not connected or missing socketId`);
    return false;
  }
}

/**
 * Send a typing notification to a user by userId
 */
export async function sendTypingToUser(
  userId: string,
  payload: { conversationId: string; isTyping: boolean; message?: string },
) {
  if (!io) throw new Error('Socket server not initialized');
  const user = await UserModel.findById(userId).lean();
  const event = payload.isTyping ? SocketMessageEnum.TYPING : SocketMessageEnum.TYPING_STOP;

  if (user && user.socketId) {
    io.to(user.socketId).emit(event, payload);
    logger.info(`Sent ${event} to user ${userId} via socket ${user.socketId}`);
    return true;
  } else {
    logger.warn(`User ${userId} not connected or missing socketId`);
    return false;
  }
}
