import mongoose from 'mongoose';
import { IUsageStatistic } from '../types/preferenceType';
import { getBaseModel, getBaseSchema } from './baseModel';

const UsageStatisticSchema = getBaseSchema<IUsageStatistic>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  ideasGenerated: {
    type: Number,
    default: 0,
  },
  conversationsStarted: {
    type: Number,
    default: 0,
  },
  messagesExchanged: {
    type: Number,
    default: 0,
  },
});

// Create a compound index for userId + date for quick lookups
UsageStatisticSchema.index({ userId: 1, date: 1 }, { unique: true });

export const UsageStatisticModel = getBaseModel<IUsageStatistic>(
  'UsageStatistic',
  UsageStatisticSchema,
);
