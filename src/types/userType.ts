import { IBaseDocument } from './baseType';

export enum UserRoleEnum {
  USER = 'user',
  ADMIN = 'admin',
}

export interface IUser extends IBaseDocument {
  // fields
  profilePicture: string;
  fullName: string;
  username: string;
  usernameSlug: string;
  usernameUpdatedAt: Date;
  email: string;
  isEmailVerified: boolean;
  password?: string;
  passwordUpdatedAt?: Date;
  role: UserRoleEnum;
  lastLoginAt: Date;
  memberSince: Date;
  remainingIdeas: number;
  lastIdeaResetDate: Date;
  apiKey?: string;
  apiStatus: ApiStatusEnum;
}

export enum ApiStatusEnum {
  NOT_CONFIGURED = 'Not Configured',
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export interface IUpdateUserProfilePayload {
  fullName?: string;
  username?: string;
  profilePicture?: string;
}
