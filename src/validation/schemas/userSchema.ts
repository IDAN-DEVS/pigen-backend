import Joi from 'joi';

const updateUserProfile = Joi.object({
  image: Joi.string().trim().optional(),
  firstName: Joi.string().trim().optional(),
  lastName: Joi.string().trim().optional(),
  username: Joi.string().trim().optional(),
  password: Joi.string().trim().optional(),
  referralCode: Joi.string().trim().optional(),
});

export const userValidationSchema = {
  updateUserProfile,
};
