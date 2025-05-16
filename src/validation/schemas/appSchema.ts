import Joi from 'joi';

export const sampleValidation = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const appSchema = {
  sampleValidation,
};
