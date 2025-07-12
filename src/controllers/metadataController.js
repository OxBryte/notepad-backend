// src/controllers/metadataController.js
const { getMetadata } = require('../config/ipfs');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

const getMetadataFromIPFS = asyncHandler(async (req, res) => {
  const { hash } = req.params;
  
  try {
    const metadata = await getMetadata(hash);
    
    res.json({
      success: true,
      data: metadata
    });
  } catch (error) {
    logger.error('Failed to fetch metadata:', { hash, error: error.message });
    res.status(404).json({
      success: false,
      error: 'Metadata not found'
    });
  }
});

const uploadMetadata = asyncHandler(async (req, res) => {
  // This endpoint could be used for uploading custom metadata
  // For now, metadata upload is handled in the idea creation process
  res.status(501).json({
    success: false,
    error: 'Not implemented - metadata upload is handled during idea creation'
  });
});

module.exports = {
  getMetadataFromIPFS,
  uploadMetadata
};