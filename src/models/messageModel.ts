import mongoose from 'mongoose';
import { IMessage, SenderEnum } from '../types/conversationType';
import { getBaseModel, getBaseSchema } from './baseModel';

const MessageSchema = getBaseSchema<IMessage>({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  sender: {
    type: String,
    enum: Object.values(SenderEnum),
    required: true,
  },
  containsIdea: {
    type: Boolean,
    default: false,
    index: true,
  },
  idea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Idea',
    index: true,
    sparse: true,
  },
});

export const MessageModel = getBaseModel<IMessage>('Message', MessageSchema);
