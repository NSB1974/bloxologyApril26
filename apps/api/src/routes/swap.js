import express from 'express';
import { ethers } from 'ethers';
import logger from '../utils/logger.js';

const router = express.Router();

const SUPPORTED_NETWORKS = ['ethereum', 'base', 'polygon', 'kava'];

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

// Helper function to validate slippage
const validateSlippage = (slippage) => {
  const num = parseFloat(slippage);
  if (isNaN(num) || num < 0 || num > 100) {
    throw new Error(`Invalid slippage: ${slippage}. Must be between 0 and 100.`);
  }
  return num;
};

// Helper function to generate transaction hash
const generateTxHash = () => {
  return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

router.post('/', async (req, res) => {
  const { fromToken, toToken, amount, slippage, walletAddress, network } = req.body;

  // Validate required fields
  if (!fromToken || !toToken || !amount || slippage === undefined || !walletAddress || !network) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: fromToken, toToken, amount, slippage, walletAddress, network',
    });
  }

  // Validate addresses
  validateAddress(fromToken);
  validateAddress(toToken);
  validateAddress(walletAddress);

  // Validate tokens are different
  if (fromToken.toLowerCase() === toToken.toLowerCase()) {
    throw new Error('fromToken and toToken must be different addresses');
  }

  // Validate amount
  const validatedAmount = validateAmount(amount);

  // Validate slippage
  const validatedSlippage = validateSlippage(slippage);

  // Validate network
  const networkLower = network.toLowerCase();
  if (!SUPPORTED_NETWORKS.includes(networkLower)) {
    throw new Error(
      `Unsupported network: ${network}. Supported networks: ${SUPPORTED_NETWORKS.join(', ')}`
    );
  }

  // Calculate swap rate (simulated - in production, use price oracle)
  const baseSwapRate = Math.random() * 2 + 0.5; // Random rate between 0.5 and 2.5
  const slippageMultiplier = 1 - validatedSlippage / 100;
  const swapRate = baseSwapRate * slippageMultiplier;

  // Calculate estimated output
  const estimatedOutput = (validatedAmount * swapRate).toFixed(8);

  // Calculate fee (0.3% of input amount)
  const feePercentage = 0.003;
  const fee = (validatedAmount * feePercentage).toFixed(8);

  // Generate transaction hash
  const transactionHash = generateTxHash();

  logger.info(
    `Swap executed: ${validatedAmount} ${fromToken} -> ${estimatedOutput} ${toToken} on ${network} by ${walletAddress}`
  );

  res.json({
    success: true,
    swapRate: parseFloat(swapRate.toFixed(8)),
    estimatedOutput,
    fee,
    transactionHash,
  });
});

export default router;