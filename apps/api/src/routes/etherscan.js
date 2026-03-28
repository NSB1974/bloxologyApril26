import express from 'express';
import logger from '../utils/logger.js';
import {
  getAccountBalance,
  getMultipleAccountBalances,
  getAccountTransactions,
  getContractAbi,
  getContractSourceCode,
  getGasTracker,
  getTokenBalance,
  getTokenSupply,
} from '../services/etherscanService.js';

const router = express.Router();

// GET /etherscan/account-balance - Get account balance
router.get('/account-balance', async (req, res) => {
  const { address, chainId = 1 } = req.query;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query parameter: address',
    });
  }

  const data = await getAccountBalance(address, parseInt(chainId, 10));

  logger.info(`Account balance retrieved for ${address}`);

  res.json({
    success: true,
    data,
    error: null,
  });
});

// POST /etherscan/multiple-balances - Get multiple account balances
router.post('/multiple-balances', async (req, res) => {
  const { addresses, chainId = 1 } = req.body;

  if (!addresses) {
    return res.status(400).json({
      success: false,
      error: 'Missing required body parameter: addresses',
    });
  }

  const data = await getMultipleAccountBalances(addresses, parseInt(chainId, 10));

  logger.info(`Multiple account balances retrieved for ${addresses.length} addresses`);

  res.json({
    success: true,
    data,
    error: null,
  });
});

// GET /etherscan/transactions - Get account transactions
router.get('/transactions', async (req, res) => {
  const { address, startblock = 0, endblock = 99999999, sort = 'asc', chainId = 1 } = req.query;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query parameter: address',
    });
  }

  const data = await getAccountTransactions(address, startblock, endblock, sort, parseInt(chainId, 10));

  logger.info(`Transactions retrieved for ${address}`);

  res.json({
    success: true,
    data,
    error: null,
  });
});

// GET /etherscan/contract-abi - Get contract ABI
router.get('/contract-abi', async (req, res) => {
  const { address, chainId = 1 } = req.query;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query parameter: address',
    });
  }

  const data = await getContractAbi(address, parseInt(chainId, 10));

  logger.info(`Contract ABI retrieved for ${address}`);

  res.json({
    success: true,
    data,
    error: null,
  });
});

// GET /etherscan/contract-source - Get contract source code
router.get('/contract-source', async (req, res) => {
  const { address, chainId = 1 } = req.query;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query parameter: address',
    });
  }

  const data = await getContractSourceCode(address, parseInt(chainId, 10));

  logger.info(`Contract source code retrieved for ${address}`);

  res.json({
    success: true,
    data,
    error: null,
  });
});

// GET /etherscan/gas-tracker - Get gas tracker
router.get('/gas-tracker', async (req, res) => {
  const { chainId = 1 } = req.query;
  const data = await getGasTracker(parseInt(chainId, 10));

  logger.info('Gas tracker data retrieved');

  res.json({
    success: true,
    data,
    error: null,
  });
});

// GET /etherscan/token-balance - Get token balance
router.get('/token-balance', async (req, res) => {
  const { contractAddress, walletAddress, chainId = 1 } = req.query;

  if (!contractAddress || !walletAddress) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query parameters: contractAddress, walletAddress',
    });
  }

  const data = await getTokenBalance(contractAddress, walletAddress, parseInt(chainId, 10));

  logger.info(`Token balance retrieved for ${walletAddress}`);

  res.json({
    success: true,
    data,
    error: null,
  });
});

// GET /etherscan/token-supply - Get token supply
router.get('/token-supply', async (req, res) => {
  const { contractAddress, chainId = 1 } = req.query;

  if (!contractAddress) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query parameter: contractAddress',
    });
  }

  const data = await getTokenSupply(contractAddress, parseInt(chainId, 10));

  logger.info(`Token supply retrieved for ${contractAddress}`);

  res.json({
    success: true,
    data,
    error: null,
  });
});

export default router;
