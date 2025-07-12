// src/services/ipfsService.js
const { uploadJSON, uploadFile, getMetadata } = require('../config/ipfs');
const logger = require('../utils/logger');

class IPFSService {
  static async uploadIdeaMetadata(ideaData) {
    try {
      const metadata = {
        title: ideaData.title,
        content: ideaData.content,
        category: ideaData.category,
        tags: ideaData.tags || [],
        creator: ideaData.creator,
        createdAt: new Date().toISOString(),
        version: '1.0',
        type: 'public-notepad-idea'
      };

      const options = {
        pinataMetadata: {
          name: `idea-${ideaData.title.substring(0, 30)}-${Date.now()}`,
          keyvalues: {
            creator: ideaData.creator,
            category: ideaData.category,
            type: 'idea-metadata',
            version: '1.0'
          }
        }
      };

      const result = await uploadJSON(metadata, options);
      
      logger.info('Idea metadata uploaded to IPFS:', {
        hash: result.hash,
        title: ideaData.title,
        creator: ideaData.creator
      });

      return result;
    } catch (error) {
      logger.error('Failed to upload idea metadata to IPFS:', error);
      throw new Error('Failed to store metadata on IPFS');
    }
  }

  static async uploadUserAvatar(fileBuffer, fileName, walletAddress) {
    try {
      const options = {
        pinataMetadata: {
          name: `avatar-${walletAddress}-${Date.now()}`,
          keyvalues: {
            type: 'user-avatar',
            wallet: walletAddress
          }
        }
      };

      const result = await uploadFile(fileBuffer, fileName, options);
      
      logger.info('User avatar uploaded to IPFS:', {
        hash: result.hash,
        wallet: walletAddress,
        fileName
      });

      return result;
    } catch (error) {
      logger.error('Failed to upload avatar to IPFS:', error);
      throw new Error('Failed to upload avatar');
    }
  }

  static async getIdeaMetadata(hash) {
    try {
      const metadata = await getMetadata(hash);
      
      // Validate metadata structure
      if (!metadata.title || !metadata.content || !metadata.creator) {
        throw new Error('Invalid metadata structure');
      }

      return metadata;
    } catch (error) {
      logger.error('Failed to fetch idea metadata from IPFS:', { hash, error: error.message });
      throw new Error('Failed to retrieve metadata');
    }
  }
}

module.exports = IPFSService;