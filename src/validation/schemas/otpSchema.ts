import Joi from 'joi';
import { OtpTypeEnum } from '../../types/otpType';

export const requestOtp = Joi.object({
  email: Joi.string().email().required(),
  type: Joi.string()
    .valid(...Object.values(OtpTypeEnum))
    .required(),
});

export const validateOtp = Joi.object({
  email: Joi.string().email().required(),
  type: Joi.string()
    .valid(...Object.values(OtpTypeEnum))
    .required(),
  code: Joi.string().required(),
  delete: Joi.boolean().optional(),
});

export const otpValidationSchema = {
  requestOtp,
  validateOtp,
};
