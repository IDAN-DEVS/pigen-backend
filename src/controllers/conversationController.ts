import { Response } from 'express';
import { ResponseHelper } from '../core/http/response';
import { conversationService } from '../services/conversationService';
import { IAuthRequest } from '../types/authType';
import { IUser } from '../types/userType';
import { asyncHandler } from '../utils/asyncHandler';
import {
  ICreateConversationPayload,
  IGetConversationMessagesPayload,
  ISendMessagePayload,
} from '../types/conversationType';
import { IPaginationQuery } from '../types/baseType';

const createConversation = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const payload: ICreateConversationPayload = req.body;
  const user = req.user as IUser;

  const conversation = await conversationService.createConversation(payload, user);
  return ResponseHelper.success(res, conversation, 'Conversation created successfully', 201);
});

const getUserConversations = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const user = req.user as IUser;
  const query = req.query as unknown as IPaginationQuery;

  const conversations = await conversationService.getUserConversations(query, user);
  return ResponseHelper.success(res, conversations, 'Conversations retrieved successfully');
});

const sendMessage = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const payload: ISendMessagePayload = req.body;
  const user = req.user as IUser;

  await conversationService.sendMessage(payload, user);

  return ResponseHelper.created(res);
});

const getConversationMessage = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const user = req.user as IUser;
  const query = req.query as unknown as IGetConversationMessagesPayload;

  const messages = await conversationService.getConversationMessages(query, user);
  return ResponseHelper.success(res, messages, 'Messages retrieved successfully');
});

export const conversationController = {
  createConversation,
  getUserConversations,
  sendMessage,
  getConversationMessage,
};
