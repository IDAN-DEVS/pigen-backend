import { AppError } from '../core/errors/appError';
import { UserModel } from '../models/userModel';
import {
  IEmailLoginRequest,
  IRegisterPayload,
  IResetPasswordPayload,
  ISocialAuthPayload,
  IVerifyEmailRequest,
} from '../types/authType';
import { authHelperUtil } from '../utils/authHelper';
import { baseHelper } from '../utils/baseHelper';
import { IUser } from '../types/userType';
import { otpService } from './otpService';
import { OtpTypeEnum } from '../types/otpType';
import { cacheConstants } from '../constants/cacheConstant';
import { cacheHelper } from '../utils/cacheHelper';
import { ErrorCodesEnum, StatusCodesEnum } from '../core/http/statusCodes';
import { OAuth2Client } from 'google-auth-library';
import { welcomeEmailTemplate } from '../constants/emailTemplates/welcomeEmailTemplate';

let googleClient = new OAuth2Client();

const registerWithEmail = async (payload: IRegisterPayload) => {
  // Check if email already exists
  const existingEmail = await UserModel.exists({ email: payload.email });
  if (existingEmail) {
    throw new AppError('Email is already registered.', 400);
  }

  let createPayload: Partial<IUser> = {
    email: payload.email,
    role: payload.role,
    isEmailVerified: false,
    lastLoginAt: new Date(),
  };

  // Create new user
  const newUser = await UserModel.create(createPayload);

  // check if user email is verified
  if (!newUser.isEmailVerified) {
    await otpService.sendOtp({
      email: newUser.email,
      type: OtpTypeEnum.VERIFY_EMAIL,
    });
  }

  return generateJwtToken(newUser, '10m');
};

const generateJwtToken = (user: IUser, expiresIn?: string) => {
  // Generate JWT token
  const token = authHelperUtil.generateJwtToken(
    baseHelper.getMongoDbResourceId(user),
    user.role,
    expiresIn,
  );

  return {
    token,
    user,
  };
};

const loginWithEmail = async (credentials: IEmailLoginRequest) => {
  // Find user by email
  const user = await UserModel.findOne({ email: credentials.email }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.password) {
    throw new AppError(
      'No password found for this user.',
      StatusCodesEnum.UNAUTHORIZED,
      ErrorCodesEnum.PASSWORD_NOT_CONFIGURED,
    );
  }

  // Verify password
  const isPasswordValid = await authHelperUtil.comparePassword(credentials.password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Update last login timestamp
  UserModel.updateOne(
    { _id: baseHelper.getMongoDbResourceId(user) },
    {
      $set: {
        lastLoginAt: new Date(),
      },
    },
  ).then(() => console.log('last login date updated'));

  return generateJwtToken(user);
};

const verifyEmail = async (payload: IVerifyEmailRequest): Promise<boolean> => {
  const otpCacheKey = cacheConstants.cacheKeys.otpRequest(payload.email, OtpTypeEnum.VERIFY_EMAIL);
  const otpCodeFromCache = await cacheHelper.getCache(otpCacheKey);

  if (!otpCodeFromCache) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  if (Number(otpCodeFromCache) !== Number(payload.code)) {
    throw new AppError('Invalid OTP', 400);
  }

  const user = await UserModel.findOneAndUpdate(
    { email: payload.email },
    { $set: { isEmailVerified: true } },
  );

  if (!user) {
    throw new AppError('Invalid email provided', 404);
  }

  await cacheHelper.removeFromCache(otpCacheKey);

  return true;
};

const socialAuth = async (payload: ISocialAuthPayload) => {
  return await handleGoogleAuth(payload);
};

const handleGoogleAuth = async (payload: ISocialAuthPayload) => {
  // First, get ID token info using the access token
  const tokenInfo = await googleClient.getTokenInfo(payload.token);

  // Verify token expiration
  if (tokenInfo.expiry_date < Date.now()) {
    throw new AppError(
      'Google auth - Token expired, please try again.',
      StatusCodesEnum.BAD_REQUEST,
    );
  }

  const client = new OAuth2Client();
  client.setCredentials({
    access_token: payload.token,
  });

  // Get user information using the verified token
  const userInfoResponse = await client.request({
    url: 'https://www.googleapis.com/oauth2/v3/userinfo',
  });

  const userData = userInfoResponse.data as {
    email: string;
    email_verified: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
  };

  // Additional validations
  if (!userData?.email || !userData?.email_verified) {
    throw new AppError('Kindly verify your google email to proceed', StatusCodesEnum.BAD_REQUEST);
  }

  let user = await UserModel.findOne({ email: userData.email });

  if (!user) {
    user = await UserModel.create({
      email: userData.email,
      isEmailVerified: true,
      profileImage: userData.picture,
      fullName: userData?.name || userData?.given_name + ' ' + userData?.family_name,
    });

    // Send welcome email for new Google sign ups
    const { mailService } = await import('./mailService');
    await mailService.sendEmail({
      to: userData.email,
      subject: 'Welcome to PIGEN!',
      html: welcomeEmailTemplate({ name: user?.fullName }),
    });
  } else {
    UserModel.updateOne(
      {
        email: userData.email,
      },
      {
        $set: {
          lastLoginAt: new Date(),
        },
      },
    ).then(() => {
      console.log('last login date updated');
    });
  }

  return generateJwtToken(user);
};

const resetPassword = async (payload: IResetPasswordPayload) => {
  const cacheKey = cacheConstants.cacheKeys.otpRequest(payload.email, OtpTypeEnum.RESET_PASSWORD);
  const otpCodeFromCache = await cacheHelper.getCache(cacheKey);

  if (!otpCodeFromCache) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  if (Number(otpCodeFromCache) !== Number(payload.code)) {
    throw new AppError('Invalid OTP', StatusCodesEnum.BAD_REQUEST);
  }

  const hashedPassword = await authHelperUtil.hashPassword(payload.password);

  await UserModel.updateOne({ email: payload.email }, { $set: { password: hashedPassword } });

  await cacheHelper.removeFromCache(cacheKey);

  return true;
};

export const authService = {
  registerWithEmail,
  loginWithEmail,
  verifyEmail,
  socialAuth,
  resetPassword,
};
