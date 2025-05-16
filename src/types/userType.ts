import { IBaseDocument } from './baseType';

export enum UserRoleEnum {
  USER = 'user',
  ADMIN = 'admin',
}

export interface IUser extends IBaseDocument {
  // fields
  image: string;
  firstName: string;
  lastName: string;
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
}

export interface IUpdateUserProfilePayload {
  image: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  referralCode: string;
}
