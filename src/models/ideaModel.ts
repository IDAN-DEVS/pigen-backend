import { IdeaCategoryEnum, IdeaIconEnum, IIdea } from '../types/conversationType';
import { getBaseModel, getBaseSchema } from './baseModel';
import mongoose from 'mongoose';

const IdeaSchema = getBaseSchema<IIdea>({
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
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  summary: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: Object.values(IdeaCategoryEnum),
    default: IdeaCategoryEnum.ALL,
    index: true,
  },
  icon: {
    type: String,
    enum: Object.values(IdeaIconEnum),
    default: IdeaIconEnum.LIGHTNING,
  },
  problemSolved: {
    type: String,
    required: true,
  },
  targetAudience: {
    type: String,
    required: true,
  },
  coreFeatures: {
    type: [String],
    default: [],
  },
  benefits: {
    type: [String],
    default: [],
  },
  techStack: {
    type: [String],
    default: [],
  },
  monetization: {
    type: [String],
    default: [],
  },
  challenges: {
    type: [String],
    default: [],
  },
  nextSteps: {
    type: [String],
    default: [],
  },
});

export const IdeaModel = getBaseModel<IIdea>('Idea', IdeaSchema);
