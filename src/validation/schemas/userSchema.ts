import Joi from 'joi';

const updateUserProfile = Joi.object({
  fullName: Joi.string().trim().optional(),
  username: Joi.string().trim().optional(),
  profilePicture: Joi.string().trim().optional(),
});

export const userValidationSchema = {
  updateUserProfile,
};
