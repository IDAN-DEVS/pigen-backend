import Joi from 'joi';

const register = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Please provide a valid phone number with country code (e.g., +123456789).',
      'string.empty': 'Phone number is required.',
      'any.required': 'Phone number is required.',
    }),
  referralCode: Joi.string().optional(),
});

const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const verifyEmail = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().required(),
});

const socialAuth = Joi.object({
  token: Joi.string().required(),
});

const resetPassword = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().required(),
  password: Joi.string().required(),
});

export const authValidationSchema = {
  register,
  login,
  verifyEmail,
  socialAuth,
  resetPassword,
};
