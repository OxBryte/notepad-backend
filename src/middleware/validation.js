// src/middleware/validation.js
const Joi = require('joi');
const { validateWalletAddress } = require('../utils/helpers');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

// Authentication schemas
const loginSchema = Joi.object({
  walletAddress: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid wallet address format'
    }),
  signature: Joi.string().required(),
  message: Joi.string().required()
});

// User schemas
const updateUserSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .optional()
    .messages({
      'string.alphanum': 'Username can only contain letters and numbers',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 50 characters'
    }),
  bio: Joi.string().max(500).optional(),
  avatarUrl: Joi.string().uri().optional()
});

// Idea schemas
const createIdeaSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Title is required',
      'string.max': 'Title cannot exceed 200 characters'
    }),
  content: Joi.string()
    .min(10)
    .max(2000)
    .required()
    .messages({
      'string.empty': 'Content is required',
      'string.min': 'Content must be at least 10 characters',
      'string.max': 'Content cannot exceed 2000 characters'
    }),
  category: Joi.string()
    .valid('general', 'technology', 'business', 'science', 'arts', 'social', 'environment', 'education', 'health')
    .default('general'),
  tags: Joi.array()
    .items(Joi.string().max(30))
    .max(10)
    .default([])
    .messages({
      'array.max': 'Maximum 10 tags allowed'
    })
});

const updateMintInfoSchema = Joi.object({
  tokenId: Joi.number().integer().positive().required(),
  transactionHash: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{64}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid transaction hash format'
    })
});

// Interaction schemas
const interactionSchema = Joi.object({
  type: Joi.string()
    .valid('like', 'comment', 'build', 'share')
    .required(),
  content: Joi.when('type', {
    is: 'comment',
    then: Joi.string().min(1).max(500).required(),
    otherwise: Joi.string().optional()
  })
});

// Query validation
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.query = value;
    next();
  };
};

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('created_at', 'updated_at', 'minted_at', 'interaction_count').default('created_at'),
  order: Joi.string().valid('asc', 'desc').default('desc')
});

const searchSchema = Joi.object({
  search: Joi.string().max(100).optional(),
  category: Joi.string().valid('general', 'technology', 'business', 'science', 'arts', 'social', 'environment', 'education', 'health').optional(),
  tags: Joi.string().optional(), // comma-separated tags
  author: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional()
}).concat(paginationSchema);

module.exports = {
  validate,
  validateQuery,
  schemas: {
    login: loginSchema,
    updateUser: updateUserSchema,
    createIdea: createIdeaSchema,
    updateMintInfo: updateMintInfoSchema,
    interaction: interactionSchema,
    pagination: paginationSchema,
    search: searchSchema
  }
};