// src/services/blockchainService.js
const { ethers } = require('ethers');
const config = require('../config');
const logger = require('../utils/logger');

class BlockchainService {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(config.blockchain.baseRpcUrl);
    this.testnetProvider = new ethers.providers.JsonRpcProvider(config.blockchain.baseTestnetRpcUrl);
  }

  async validateTransaction(transactionHash, expectedContractAddress = null) {
    try {
      const tx = await this.provider.getTransaction(transactionHash);
      
      if (!tx) {
        throw new Error('Transaction not found');
      }

      const receipt = await this.provider.getTransactionReceipt(transactionHash);
      
      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed or pending');
      }

      // Validate contract address if provided
      if (expectedContractAddress && tx.to?.toLowerCase() !== expectedContractAddress.toLowerCase()) {
        throw new Error('Transaction not sent to expected contract');
      }

      return {
        valid: true,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        contractAddress: tx.to,
        from: tx.from
      };
    } catch (error) {
      logger.error('Transaction validation failed:', { transactionHash, error: error.message });
      throw error;
    }
  }

  async getTokenInfo(contractAddress, tokenId) {
    try {
      // This would require the contract ABI to interact with
      // For now, return basic info
      return {
        contractAddress,
        tokenId,
        blockchain: 'Base',
        standard: 'ERC-721'
      };
    } catch (error) {
      logger.error('Failed to get token info:', { contractAddress, tokenId, error: error.message });
      throw error;
    }
  }

  async estimateGasCost(contractAddress, functionName, args = []) {
    try {
      // This would require contract ABI and specific function calls
      // Return estimated gas for minting (placeholder)
      return {
        estimatedGas: '50000',
        estimatedCostETH: '0.001',
        estimatedCostUSD: '2.50'
      };
    } catch (error) {
      logger.error('Gas estimation failed:', error);
      throw error;
    }
  }
}

module.exports = BlockchainService;