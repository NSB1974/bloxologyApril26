import express from 'express';
import { ethers } from 'ethers';
import logger from '../utils/logger.js';

const router = express.Router();

const SUPPORTED_NETWORKS = ['ethereum', 'base', 'polygon', 'kava'];

// In-memory storage for liquidity pools
const liquidityPools = new Map();

// Helper function to validate Ethereum address
const validateAddress = (address) => {
  if (!ethers.isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
};

// Helper function to validate amount
const validateAmount = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    throw new Error(`Invalid amount: ${amount}. Must be a positive number.`);
  }
  return num;
};

// Helper function to generate transaction hash
const generateTxHash = () => {
  return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

router.post('/', async (req, res) => {
  const { operation, token1, token2, amount1, amount2, poolId, walletAddress, network } = req.body;

  // Validate required fields
  if (!operation || !walletAddress || !network) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: operation, walletAddress, network',
    });
  }

  // Validate operation
  if (operation !== 'add' && operation !== 'remove') {
    return res.status(400).json({
      success: false,
      error: "Invalid operation: must be 'add' or 'remove'",
    });
  }

  // Validate wallet address
  validateAddress(walletAddress);

  // Validate network
  const networkLower = network.toLowerCase();
  if (!SUPPORTED_NETWORKS.includes(networkLower)) {
    throw new Error(
      `Unsupported network: ${network}. Supported networks: ${SUPPORTED_NETWORKS.join(', ')}`
    );
  }

  if (operation === 'add') {
    // Validate required fields for add operation
    if (!token1 || !token2 || !amount1 || !amount2) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields for add operation: token1, token2, amount1, amount2',
      });
    }

    // Validate addresses
    validateAddress(token1);
    validateAddress(token2);

    // Validate tokens are different
    if (token1.toLowerCase() === token2.toLowerCase()) {
      throw new Error('token1 and token2 must be different addresses');
    }

    // Validate amounts
    const validatedAmount1 = validateAmount(amount1);
    const validatedAmount2 = validateAmount(amount2);

    // Create pool key
    const poolKey = [token1.toLowerCase(), token2.toLowerCase()].sort().join('-');

    // Get or create pool
    const existingPool = liquidityPools.get(poolKey) || {
      totalLiquidity1: 0,
      totalLiquidity2: 0,
      providers: {},
    };

    // Update pool
    existingPool.totalLiquidity1 += validatedAmount1;
    existingPool.totalLiquidity2 += validatedAmount2;
    existingPool.providers[walletAddress.toLowerCase()] = {
      amount1: (existingPool.providers[walletAddress.toLowerCase()]?.amount1 || 0) + validatedAmount1,
      amount2: (existingPool.providers[walletAddress.toLowerCase()]?.amount2 || 0) + validatedAmount2,
    };

    liquidityPools.set(poolKey, existingPool);

    // Calculate pool share percentage
    const totalLiquidity = validatedAmount1 + validatedAmount2;
    const poolShare = (totalLiquidity / (existingPool.totalLiquidity1 + existingPool.totalLiquidity2)) * 100;

    const transactionHash = generateTxHash();

    logger.info(
      `Liquidity added to pool ${poolKey} by ${walletAddress}: ${validatedAmount1} + ${validatedAmount2}`
    );

    res.json({
      success: true,
      poolShare: parseFloat(poolShare.toFixed(2)),
      liquidityAmount: (validatedAmount1 + validatedAmount2).toFixed(8),
      transactionHash,
    });
  } else if (operation === 'remove') {
    // Validate required fields for remove operation
    if (!poolId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field for remove operation: poolId',
      });
    }

    // Check if pool exists
    const pool = liquidityPools.get(poolId);
    if (!pool) {
      throw new Error(`Liquidity pool not found: ${poolId}`);
    }

    // Check if wallet has liquidity in this pool
    const provider = pool.providers[walletAddress.toLowerCase()];
    if (!provider) {
      throw new Error(`No liquidity found for wallet ${walletAddress} in pool ${poolId}`);
    }

    const removedAmount1 = provider.amount1;
    const removedAmount2 = provider.amount2;
    const totalRemoved = removedAmount1 + removedAmount2;

    // Update pool
    pool.totalLiquidity1 -= removedAmount1;
    pool.totalLiquidity2 -= removedAmount2;
    delete pool.providers[walletAddress.toLowerCase()];

    // Remove pool if empty
    if (pool.totalLiquidity1 === 0 && pool.totalLiquidity2 === 0) {
      liquidityPools.delete(poolId);
    }

    const transactionHash = generateTxHash();

    logger.info(
      `Liquidity removed from pool ${poolId} by ${walletAddress}: ${removedAmount1} + ${removedAmount2}`
    );

    res.json({
      success: true,
      poolShare: 0,
      liquidityAmount: totalRemoved.toFixed(8),
      transactionHash,
    });
  }
});

export default router;