import { ApiStatusEnum, IUser, UserRoleEnum } from '../types/userType';
import { getBaseModel, getBaseSchema } from './baseModel';

const UserSchema = getBaseSchema<IUser>({
  // fields
  fullName: {
    type: String,
    index: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    trim: true,
  },
  usernameSlug: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  usernameUpdatedAt: {
    type: Date,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    trim: true,
    lowercase: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    select: false,
  },
  passwordUpdatedAt: {
    type: Date,
  },
  role: {
    type: String,
    enum: Object.values(UserRoleEnum),
    index: true,
    required: true,
    default: UserRoleEnum.USER,
  },
  lastLoginAt: {
    type: Date,
  },
  profilePicture: {
    type: String,
    default: '',
  },
  memberSince: {
    type: Date,
    default: Date.now,
  },
  remainingIdeas: {
    type: Number,
    default: 10,
  },
  lastIdeaResetDate: {
    type: Date,
    default: Date.now,
  },
  apiKey: {
    type: String,
    select: false,
  },
  apiStatus: {
    type: String,
    enum: Object.values(ApiStatusEnum),
    default: ApiStatusEnum.NOT_CONFIGURED,
  },
});

export const UserModel = getBaseModel<IUser>('User', UserSchema);
