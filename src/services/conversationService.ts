import { ConversationModel } from '../models/conversationModel';
import { MessageModel } from '../models/messageModel';
import {
  IConversation,
  ICreateConversationPayload,
  IGetConversationMessagesPayload,
  IMessage,
  ISendMessagePayload,
  SenderEnum,
} from '../types/conversationType';
import { IUser } from '../types/userType';
import { paginationHelper } from '../utils/paginationHelper';
import { IPaginationQuery, IPaginatedResponse } from '../types/baseType';
import { AppError } from '../core/errors/appError';
import { baseHelper } from '../utils/baseHelper';
import { StatusCodesEnum } from '../core/http/statusCodes';
import { aiService } from './aiService';
import { logger } from '../utils/logger';
import { UserModel } from '../models';

const createConversation = async (
  payload: ICreateConversationPayload,
  user: IUser,
): Promise<IConversation> => {
  const { title, message } = payload;

  const newConversation = await ConversationModel.create({
    user: baseHelper.getMongoDbResourceId(user),
    title,
  });

  // Create the first user message
  const firstUserMessage = await MessageModel.create({
    user: baseHelper.getMongoDbResourceId(user),
    conversation: baseHelper.getMongoDbResourceId(newConversation),
    content: message,
    sender: SenderEnum.USER,
  });

  // Trigger AI reply to the first message
  // Pass the user object itself, and the content of the first message
  aiService
    .generateAndSaveAiReply(
      baseHelper.getMongoDbResourceId(newConversation),
      user,
      firstUserMessage.content,
    )
    .catch(error => logger.error('Error triggering AI reply for new conversation:', error));

  return newConversation;
};

const getUserConversations = async (
  query: IPaginationQuery,
  user: IUser,
): Promise<IPaginatedResponse<IConversation>> => {
  return paginationHelper.find<IConversation>({
    model: ConversationModel,
    query: { user: baseHelper.getMongoDbResourceId(user) },
    paginationOptions: query,
  });
};

const sendMessage = async (payload: ISendMessagePayload, user: IUser): Promise<IMessage> => {
  const { conversationId, content } = payload;

  // validate user has enough credit
  if (user.remainingIdeas <= 0) {
    throw new AppError('Not enough credit', StatusCodesEnum.FORBIDDEN);
  }

  const conversation = await ConversationModel.findById(conversationId).lean();

  if (!conversation) {
    throw new AppError('Conversation not found', StatusCodesEnum.NOT_FOUND);
  }

  if (
    baseHelper.getMongoDbResourceId(conversation.user) !== baseHelper.getMongoDbResourceId(user)
  ) {
    throw new AppError('User not authorized for this conversation', StatusCodesEnum.FORBIDDEN);
  }

  const newMessage = await MessageModel.create({
    user: baseHelper.getMongoDbResourceId(user),
    conversation: conversationId,
    content,
    sender: SenderEnum.USER,
  });

  // update user remaining ideas
  UserModel.findByIdAndUpdate(baseHelper.getMongoDbResourceId(user), {
    $inc: { remainingIdeas: -1 },
  });

  // Call AI service to generate a response, providing the user object and message content
  aiService
    .generateAndSaveAiReply(conversationId, user, content)
    .catch(error =>
      logger.error(`Error triggering AI reply for conversation ${conversationId}:`, error),
    );

  return newMessage;
};

const getConversationMessages = async (
  query: IGetConversationMessagesPayload,
  user: IUser,
): Promise<IPaginatedResponse<IMessage>> => {
  const { conversationId, ...paginationOptions } = query;

  const conversationCheck = await ConversationModel.findOne({
    _id: conversationId,
    user: baseHelper.getMongoDbResourceId(user),
  });

  if (!conversationCheck) {
    throw new AppError('Conversation not found or access denied', StatusCodesEnum.NOT_FOUND);
  }

  return paginationHelper.find<IMessage>({
    model: MessageModel,
    query: { conversation: conversationId },
    paginationOptions: {
      ...paginationOptions,
      sortField: paginationOptions.sortField || 'createdAt',
      sortOrder: paginationOptions.sortOrder || 'asc',
    },
    populate: [{ path: 'idea' }],
  });
};

const addNewMessage = async (payload: ISendMessagePayload) => {
  const { conversationId, content, sender } = payload;

  const conversation = await ConversationModel.findById(conversationId);

  if (!conversation) {
    throw new AppError(
      `Conversation not found: ${conversationId} while trying to add AI message`,
      StatusCodesEnum.NOT_FOUND,
    );
  }

  const newMessage = await MessageModel.create({
    user: baseHelper.getMongoDbResourceId(conversation.user),
    conversation: conversationId,
    content,
    sender,
  });

  return newMessage;
};

export const conversationService = {
  createConversation,
  getUserConversations,
  sendMessage,
  getConversationMessages,
  addNewMessage,
};
