import { Request } from 'express';
import { IUser, UserRoleEnum } from './userType';

export interface IJwtPayload {
  userId: string;
  role: UserRoleEnum;
  iat?: number;
  exp?: number;
}

export interface IAuthRequest extends Request {
  user?: IUser;
}

export interface IEmailLoginRequest {
  email: string;
  password: string;
}

export interface IRegisterPayload {
  email: string;
  phone: string;
  referralCode?: string;
  role: UserRoleEnum;
}

export interface IVerifyEmailRequest {
  email: string;
  code: string;
}

export interface ISocialAuthPayload {
  type: 'google';
  token: string;
  role: UserRoleEnum;
}

export interface IResetPasswordPayload {
  email: string;
  code: string;
  password: string;
}
