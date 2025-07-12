// src/controllers/ideaController.js
const { Idea, Interaction } = require('../models');
const { uploadJSON } = require('../config/ipfs');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

const getIdeas = asyncHandler(async (req, res) => {
  const result = await Idea.findAll(req.query);

  res.json({
    success: true,
    data: result
  });
});

const getIdea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const idea = await Idea.findById(id);
  if (!idea) {
    return res.status(404).json({
      success: false,
      error: 'Idea not found'
    });
  }

  // Get interaction stats
  const stats = await Interaction.getStats(id);
  
  // If user is authenticated, check their interactions
  let userInteractions = {};
  if (req.user) {
    const userLike = await Interaction.getUserInteraction(id, req.user.id, 'like');
    userInteractions.hasLiked = !!userLike;
  }

  res.json({
    success: true,
    data: {
      ...idea,
      stats,
      userInteractions
    }
  });
});

const createIdea = asyncHandler(async (req, res) => {
  const { title, content, category = 'general', tags = [] } = req.body;

  // Create metadata object
  const metadata = {
    title,
    content,
    category,
    tags,
    creator: req.user.walletAddress,
    createdAt: new Date().toISOString(),
    version: '1.0'
  };

  // Upload to IPFS
  const ipfsResult = await uploadJSON(metadata, {
    pinataMetadata: {
      name: `idea-${title.substring(0, 30)}-${Date.now()}`,
      keyvalues: {
        creator: req.user.walletAddress,
        category,
        type: 'idea-metadata'
      }
    }
  });

  // Store in database
  const newIdea = await Idea.create({
    userId: req.user.id,
    title,
    content,
    category,
    tags,
    ipfsHash: ipfsResult.hash
  });

  logger.info('New idea created:', {
    ideaId: newIdea.id,
    userId: req.user.id,
    ipfsHash: ipfsResult.hash
  });

  res.status(201).json({
    success: true,
    data: {
      ...newIdea,
      ipfsUrl: ipfsResult.url
    }
  });
});

const updateMintInfo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tokenId, transactionHash, contractAddress } = req.body;

  const updatedIdea = await Idea.updateMintInfo(id, req.user.id, {
    tokenId,
    transactionHash,
    contractAddress
  });

  if (!updatedIdea) {
    return res.status(404).json({
      success: false,
      error: 'Idea not found or unauthorized'
    });
  }

  logger.info('Idea minted:', {
    ideaId: id,
    tokenId,
    transactionHash,
    userId: req.user.id
  });

  res.json({
    success: true,
    data: updatedIdea
  });
});

const deleteIdea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const deleted = await Idea.delete(id, req.user.id);
  
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: 'Idea not found or unauthorized'
    });
  }

  logger.info('Idea deleted:', { ideaId: id, userId: req.user.id });

  res.json({
    success: true,
    message: 'Idea deleted successfully'
  });
});

const searchIdeas = asyncHandler(async (req, res) => {
  // Search is handled in the getIdeas method through query parameters
  const result = await Idea.findAll(req.query);

  res.json({
    success: true,
    data: result
  });
});

module.exports = {
  getIdeas,
  getIdea,
  createIdea,
  updateMintInfo,
  deleteIdea,
  searchIdeas
};