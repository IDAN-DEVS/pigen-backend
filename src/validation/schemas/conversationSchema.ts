import Joi from 'joi';
import { baseValidationSchema } from '..';

const createConversation = Joi.object({
  title: Joi.string().trim().optional(),
  message: Joi.string().trim().required(),
});

const sendMessage = Joi.object({
  conversationId: Joi.string().trim().required().messages({
    'string.empty': 'Conversation ID cannot be empty',
    'any.required': 'Conversation ID is required',
  }),
  content: Joi.string().trim().required().messages({
    'string.empty': 'Message content cannot be empty',
    'any.required': 'Message content is required',
  }),
});

const getMessages = baseValidationSchema.paginationSchema.append({
  conversationId: Joi.string().trim().required().messages({
    'string.empty': 'Conversation ID cannot be empty',
    'any.required': 'Conversation ID is required',
  }),
});

export const conversationValidationSchema = {
  createConversation,
  sendMessage,
  getMessages,
};
