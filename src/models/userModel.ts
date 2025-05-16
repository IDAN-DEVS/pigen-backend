import { IUser, UserRoleEnum } from '../types/userType';
import { getBaseModel, getBaseSchema } from './baseModel';

const UserSchema = getBaseSchema<IUser>({
  // fields
  image: {
    type: String,
    default: '',
  },
  firstName: {
    type: String,
    trim: true,
    default: '',
  },
  lastName: {
    type: String,
    trim: true,
    default: '',
  },
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
});

export const UserModel = getBaseModel<IUser>('User', UserSchema);
