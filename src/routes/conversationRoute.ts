import { Router } from 'express';
import { conversationController } from '../controllers/conversationController';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody, validateQuery } from '../middleware/validationMiddleware';
import { conversationValidationSchema } from '../validation/schemas/conversationSchema';
import { baseValidationSchema } from '../validation';

export const conversationRouter = Router();

conversationRouter.post(
  '/',
  authenticate,
  validateBody(conversationValidationSchema.createConversation),
  conversationController.createConversation,
);

conversationRouter.get(
  '/',
  authenticate,
  validateQuery(baseValidationSchema.paginationSchema),
  conversationController.getUserConversations,
);

conversationRouter.post(
  '/messages',
  authenticate,
  validateBody(conversationValidationSchema.sendMessage),
  conversationController.sendMessage,
);

conversationRouter.get(
  '/messages',
  authenticate,
  validateQuery(conversationValidationSchema.getMessages),
  conversationController.getConversationMessage,
);
