// src/services/notificationService.js
const { Notification, User } = require('../models');
const logger = require('../utils/logger');

class NotificationService {
  static async createInteractionNotification(interaction, idea) {
    try {
      // Don't notify if user is interacting with their own idea
      if (idea.user_id === interaction.user_id) {
        return null;
      }

      const user = await User.findById(interaction.user_id);
      const username = user?.username || 'Someone';
      
      let title, content;
      
      switch (interaction.interaction_type) {
        case 'like':
          title = `${username} liked your idea`;
          content = `"${idea.title}"`;
          break;
        case 'comment':
          title = `${username} commented on your idea`;
          content = `"${idea.title}"`;
          break;
        case 'build':
          title = `${username} wants to build your idea`;
          content = `"${idea.title}"`;
          break;
        case 'share':
          title = `${username} shared your idea`;
          content = `"${idea.title}"`;
          break;
        default:
          title = `${username} interacted with your idea`;
          content = `"${idea.title}"`;
      }

      const notification = await Notification.create({
        userId: idea.user_id,
        type: interaction.interaction_type,
        title,
        content,
        relatedUserId: interaction.user_id,
        relatedIdeaId: idea.id
      });

      logger.info('Interaction notification created:', {
        notificationId: notification.id,
        type: interaction.interaction_type,
        ideaId: idea.id,
        userId: interaction.user_id,
        targetUserId: idea.user_id
      });

      return notification;
    } catch (error) {
      logger.error('Failed to create interaction notification:', error);
      // Don't throw - notifications are not critical
      return null;
    }
  }

  static async createMintNotification(idea) {
    try {
      const notification = await Notification.create({
        userId: idea.user_id,
        type: 'mint',
        title: 'Your idea has been minted as an NFT!',
        content: `"${idea.title}" is now permanently stored on the blockchain.`,
        relatedIdeaId: idea.id
      });

      logger.info('Mint notification created:', {
        notificationId: notification.id,
        ideaId: idea.id,
        userId: idea.user_id
      });

      return notification;
    } catch (error) {
      logger.error('Failed to create mint notification:', error);
      return null;
    }
  }

  static async createFollowNotification(followerId, followingId) {
    try {
      const follower = await User.findById(followerId);
      const username = follower?.username || 'Someone';

      const notification = await Notification.create({
        userId: followingId,
        type: 'follow',
        title: `${username} started following you`,
        relatedUserId: followerId
      });

      logger.info('Follow notification created:', {
        notificationId: notification.id,
        followerId,
        followingId
      });

      return notification;
    } catch (error) {
      logger.error('Failed to create follow notification:', error);
      return null;
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      const success = await Notification.markAsRead(notificationId, userId);
      
      if (success) {
        logger.info('Notification marked as read:', { notificationId, userId });
      }
      
      return success;
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      return await Notification.getUnreadCount(userId);
    } catch (error) {
      logger.error('Failed to get unread notification count:', error);
      return 0;
    }
  }
}

module.exports = NotificationService;