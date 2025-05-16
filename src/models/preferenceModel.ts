import { IUserPreference, ThemeEnum } from '../types/preferenceType';
import { IdeaCategoryEnum } from '../types/conversationType';
import { getBaseModel, getBaseSchema } from './baseModel';
import mongoose from 'mongoose';

const UserPreferenceSchema = getBaseSchema<IUserPreference>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  theme: {
    type: String,
    enum: Object.values(ThemeEnum),
    default: ThemeEnum.DARK,
  },
  notificationsEnabled: {
    type: Boolean,
    default: true,
  },
  defaultCategory: {
    type: String,
    enum: Object.values(IdeaCategoryEnum),
    default: IdeaCategoryEnum.ALL,
  },
});

export const UserPreferenceModel = getBaseModel<IUserPreference>(
  'UserPreference',
  UserPreferenceSchema,
);
