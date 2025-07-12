// src/controllers/interactionController.js
const { Interaction, Idea, User, Notification } = require('../models');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

const createInteraction = asyncHandler(async (req, res) => {
  const { id } = req.params; // idea id
  const { type, content } = req.body;

  // Check if idea exists
  const idea = await Idea.findById(id);
  if (!idea) {
    return res.status(404).json({
      success: false,
      error: 'Idea not found'
    });
  }

  // Create interaction
  const interaction = await Interaction.create({
    ideaId: id,
    userId: req.user.id,
    type,
    content
  });

  // Handle unlike action
  if (interaction.action === 'unliked') {
    logger.info('Idea unliked:', { ideaId: id, userId: req.user.id });
    return res.json({
      success: true,
      data: { action: 'unliked' }
    });
  }

  // Create notification for idea owner (if not self-interaction)
  if (idea.user_id !== req.user.id) {
    const user = await User.findById(req.user.id);
    const username = user.username || 'Someone';
    
    let notificationTitle;
    let notificationContent = `"${idea.title}"`;
    
    switch (type) {
      case 'like':
        notificationTitle = `${username} liked your idea`;
        break;
      case 'comment':
        notificationTitle = `${username} commented on your idea`;
        break;
      case 'build':
        notificationTitle = `${username} wants to build your idea`;
        break;
      default:
        notificationTitle = `${username} interacted with your idea`;
    }

    await Notification.create({
      userId: idea.user_id,
      type,
      title: notificationTitle,
      content: notificationContent,
      relatedUserId: req.user.id,
      relatedIdeaId: id
    });
  }

  logger.info('Interaction created:', {
    interactionId: interaction.id,
    type,
    ideaId: id,
    userId: req.user.id
  });

  res.status(201).json({
    success: true,
    data: interaction
  });
});

const getInteractions = asyncHandler(async (req, res) => {
  const { id } = req.params; // idea id
  const { type } = req.query;

  const interactions = await Interaction.findByIdea(id, type);

  res.json({
    success: true,
    data: interactions
  });
});

const getInteractionStats = asyncHandler(async (req, res) => {
  const { id } = req.params; // idea id

  const stats = await Interaction.getStats(id);

  res.json({
    success: true,
    data: stats
  });
});

module.exports = {
  createInteraction,
  getInteractions,
  getInteractionStats
};