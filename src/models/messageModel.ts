import mongoose from 'mongoose';
import { IMessage, SenderEnum } from '../types/conversationType';
import { getBaseModel, getBaseSchema } from './baseModel';

const MessageSchema = getBaseSchema<IMessage>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  sender: {
    type: String,
    enum: Object.values(SenderEnum),
    required: true,
  },
  containsIdea: {
    type: Boolean,
    default: false,
  },
  idea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Idea',
    required: false,
  },
});

export const MessageModel = getBaseModel<IMessage>('Message', MessageSchema);
