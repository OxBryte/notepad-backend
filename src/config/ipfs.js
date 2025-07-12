// src/config/ipfs.js
const pinataSDK = require("@pinata/sdk");
const config = require("./index");
const logger = require("../utils/logger");

// Initialize Pinata
const pinata = new pinataSDK(
  config.ipfs.pinataApiKey,
  config.ipfs.pinataSecretKey
);

// Check if IPFS credentials are configured
const isIPFSConfigured = () => {
  return (
    config.ipfs.pinataApiKey &&
    config.ipfs.pinataSecretKey &&
    config.ipfs.pinataApiKey !== "your_pinata_api_key_here" &&
    config.ipfs.pinataSecretKey !== "your_pinata_secret_key_here"
  );
};

// Test authentication on startup
const testConnection = async () => {
  if (!isIPFSConfigured()) {
    logger.warn(
      "IPFS (Pinata) credentials not configured. IPFS functionality will be disabled."
    );
    return;
  }

  try {
    await pinata.testAuthentication();
    logger.info("IPFS (Pinata) connection successful");
  } catch (error) {
    logger.error("IPFS (Pinata) authentication failed:", error.message);
    // Don't throw error, just log it and continue
    // This prevents the app from crashing if IPFS is not available
  }
};

// Initialize connection test with proper error handling
if (config.nodeEnv !== "test") {
  testConnection().catch((error) => {
    logger.error("IPFS connection test failed:", error.message);
    // Don't re-throw to prevent unhandled promise rejection
  });
}

const uploadJSON = async (data, options = {}) => {
  try {
    const defaultOptions = {
      pinataMetadata: {
        name: `idea-${Date.now()}`,
        keyvalues: {
          type: "idea-metadata",
          timestamp: new Date().toISOString(),
        },
      },
      pinataOptions: {
        cidVersion: 0,
      },
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      pinataMetadata: {
        ...defaultOptions.pinataMetadata,
        ...options.pinataMetadata,
      },
    };

    const result = await pinata.pinJSONToIPFS(data, mergedOptions);

    logger.info("JSON uploaded to IPFS", {
      hash: result.IpfsHash,
      size: result.PinSize,
    });

    return {
      hash: result.IpfsHash,
      size: result.PinSize,
      url: `${config.ipfs.gateway}${result.IpfsHash}`,
    };
  } catch (error) {
    logger.error("Failed to upload JSON to IPFS:", error.message);
    throw new Error("Failed to upload metadata to IPFS");
  }
};

const uploadFile = async (fileBuffer, fileName, options = {}) => {
  try {
    const defaultOptions = {
      pinataMetadata: {
        name: fileName,
        keyvalues: {
          type: "file",
          timestamp: new Date().toISOString(),
        },
      },
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      pinataMetadata: {
        ...defaultOptions.pinataMetadata,
        ...options.pinataMetadata,
      },
    };

    const result = await pinata.pinFileToIPFS(fileBuffer, mergedOptions);

    logger.info("File uploaded to IPFS", {
      hash: result.IpfsHash,
      size: result.PinSize,
      fileName,
    });

    return {
      hash: result.IpfsHash,
      size: result.PinSize,
      url: `${config.ipfs.gateway}${result.IpfsHash}`,
    };
  } catch (error) {
    logger.error("Failed to upload file to IPFS:", error.message);
    throw new Error("Failed to upload file to IPFS");
  }
};

const getMetadata = async (hash) => {
  try {
    const response = await fetch(`${config.ipfs.gateway}${hash}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error("Failed to fetch metadata from IPFS:", error.message);
    throw new Error("Failed to fetch metadata from IPFS");
  }
};

module.exports = {
  pinata,
  uploadJSON,
  uploadFile,
  getMetadata,
  testConnection,
  isIPFSConfigured,
};
