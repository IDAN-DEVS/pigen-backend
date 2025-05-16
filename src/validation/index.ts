import Joi from 'joi';

/**
 * Common validation patterns
 */
const patterns = {
  // String patterns
  email: Joi.string().email().trim(),
  password: Joi.string().min(8).max(30),
  name: Joi.string().trim().min(2).max(100),
  uuid: Joi.string().uuid(),
  phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]{8,20}$/),
  url: Joi.string().uri(),
  id: Joi.string().length(24).hex().messages({
    'string.length': 'Please provide a valid id',
  }),
  positiveNumber: Joi.number().positive(),
  naturalNumber: Joi.number().integer().min(0),
  percentage: Joi.number().min(0).max(100),

  // Date patterns
  date: Joi.date(),
  futureDate: Joi.date().greater('now'),
  pastDate: Joi.date().less('now'),

  // Array patterns
  idArray: Joi.array().items(Joi.string().length(24).hex()),
  uuidArray: Joi.array().items(Joi.string().uuid()),
  stringArray: Joi.array().items(Joi.string()),
};

/**
 * Generic pagination schema
 */
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string(),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
});

const idQuerySchema = Joi.object({
  id: patterns.id.required(),
});

export const baseValidationSchema = {
  patterns,
  paginationSchema,
  idQuerySchema,
};
