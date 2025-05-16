import mongoose from 'mongoose';
import { IConversation } from '../types/conversationType';
import { getBaseModel, getBaseSchema } from './baseModel';

const ConversationSchema = getBaseSchema<IConversation>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
});

export const ConversationModel = getBaseModel<IConversation>('Conversation', ConversationSchema);
