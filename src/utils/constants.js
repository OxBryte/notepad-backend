// src/utils/constants.js
const CATEGORIES = [
  'general',
  'technology',
  'business',
  'science',
  'arts',
  'social',
  'environment',
  'education',
  'health'
];

const INTERACTION_TYPES = [
  'like',
  'comment',
  'build',
  'share'
];

const NOTIFICATION_TYPES = [
  'like',
  'comment',
  'follow',
  'mint',
  'build'
];

const USER_ROLES = [
  'user',
  'moderator',
  'admin'
];

const IDEA_STATUS = [
  'draft',
  'published',
  'minted',
  'archived'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_SIGNATURE: 'Invalid wallet signature',
  USER_NOT_FOUND: 'User not found',
  IDEA_NOT_FOUND: 'Idea not found',
  DUPLICATE_ENTRY: 'Duplicate entry',
  FILE_TOO_LARGE: 'File too large',
  INVALID_FILE_TYPE: 'Invalid file type'
};

const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PROFILE_UPDATED: 'Profile updated successfully',
  IDEA_CREATED: 'Idea created successfully',
  IDEA_UPDATED: 'Idea updated successfully',
  IDEA_DELETED: 'Idea deleted successfully',
  INTERACTION_CREATED: 'Interaction created successfully',
  NOTIFICATION_READ: 'Notification marked as read',
  FILE_UPLOADED: 'File uploaded successfully'
};

module.exports = {
  CATEGORIES,
  INTERACTION_TYPES,
  NOTIFICATION_TYPES,
  USER_ROLES,
  IDEA_STATUS,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};