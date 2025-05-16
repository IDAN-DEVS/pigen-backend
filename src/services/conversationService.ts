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

const createConversation = async (
  payload: ICreateConversationPayload,
  user: IUser,
): Promise<IConversation> => {
  const { title, message } = payload;

  const newConversation = await ConversationModel.create({
    user: baseHelper.getMongoDbResourceId(user),
    title,
  });

  await MessageModel.create({
    user: baseHelper.getMongoDbResourceId(user),
    conversation: baseHelper.getMongoDbResourceId(newConversation),
    content: message,
    sender: SenderEnum.USER,
  });

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

  const conversation = await ConversationModel.findByIdAndUpdate(conversationId, {
    $set: { lastMessageAt: new Date() },
  }).lean();

  if (!conversation) {
    throw new AppError('Conversation not found', StatusCodesEnum.NOT_FOUND);
  }

  // Ensure the user sending the message is part of the conversation
  // (or implement other authorization logic if needed, e.g. system messages)
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

  // call ai service to generate a response (in-bg)
  aiService.generateAndSaveAiReply(conversationId, content);

  return newMessage;
};

const getConversationMessages = async (
  query: IGetConversationMessagesPayload,
  user: IUser,
): Promise<IPaginatedResponse<IMessage>> => {
  const { conversationId, ...paginationOptions } = query;

  const conversation = await ConversationModel.findOne({
    _id: conversationId,
    user: baseHelper.getMongoDbResourceId(user),
  });

  if (!conversation) {
    throw new AppError('Conversation not found', StatusCodesEnum.NOT_FOUND);
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

// ai service method for adding new message
const addNewMessage = async (payload: ISendMessagePayload) => {
  const { conversationId, content } = payload;

  const conversation = await ConversationModel.findById(conversationId);

  if (!conversation) {
    throw new AppError('Conversation not found', StatusCodesEnum.NOT_FOUND);
  }

  const newMessage = await MessageModel.create({
    user: baseHelper.getMongoDbResourceId(conversation.user),
    conversation: conversationId,
    content,
    sender: SenderEnum.SYSTEM,
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
