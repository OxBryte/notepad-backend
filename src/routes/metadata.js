// src/routes/metadata.js
const express = require('express');
const metadataController = require('../controllers/metadataController');

const router = express.Router();

// Get metadata from IPFS hash
router.get('/:hash', metadataController.getMetadataFromIPFS);

// Upload metadata (not implemented - handled in idea creation)
router.post('/', metadataController.uploadMetadata);

module.exports = router;