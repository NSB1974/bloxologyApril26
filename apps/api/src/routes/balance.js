
import express from 'express';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import { RPC_ENDPOINTS, CHAIN_ID_TO_RPC_KEY, CHAIN_ID_TO_CURRENCY } from '../constants/common.js';
import { getTokenBalances } from '../services/etherscanService.js';

const router = express.Router();

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

// Well-known tokens per chain for RPC-based fallback when explorer APIs are unavailable
const KNOWN_TOKENS = {
  8453: [ // Base
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4', symbol: 'TOSHI', name: 'Toshi', decimals: 18 },
    { address: '0x532f27101965dd16442E59d40670FaF5eBB142E4', symbol: 'BRETT', name: 'Brett', decimals: 18 },
    { address: '0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe', symbol: 'HIGHER', name: 'Higher', decimals: 18 },
    { address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', symbol: 'AERO', name: 'Aerodrome', decimals: 18 },
    { address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', symbol: 'cbETH', name: 'Coinbase Wrapped Staked ETH', decimals: 18 },
    { address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452', symbol: 'wstETH', name: 'Wrapped liquid staked Ether 2.0', decimals: 18 },
    { address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', symbol: 'USDbC', name: 'USD Base Coin', decimals: 6 },
    { address: '0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c', symbol: 'rETH', name: 'Rocket Pool ETH', decimals: 18 },
    { address: '0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b', symbol: 'tBTC', name: 'tBTC v2', decimals: 18 },
    { address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', decimals: 8 },
    { address: '0xfA980cEd6895AC314E7dE34Ef1bFAE90a5AdD21b', symbol: 'PRIME', name: 'Echelon Prime', decimals: 18 },
    { address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', symbol: 'DEGEN', name: 'Degen', decimals: 18 },
    { address: '0x3C281A39944a2319aA653D81Cfd93Ca10983D234', symbol: 'MOCHI', name: 'Mochi', decimals: 18 },
    { address: '0xBC45647eA894030a4E9801Ec03479739FA2485F0', symbol: 'KEYCAT', name: 'Keyboard Cat', decimals: 18 },
  ],
};

const verifyToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    throw new Error('Unauthorized');
  }
};

// RPC-based token balance scanning for chains without explorer API support
const scanTokensViaRpc = async (address, chainId, provider) => {
  const tokens = KNOWN_TOKENS[chainId];
  if (!tokens || !provider) return [];

  logger.info(`[RPC-scan] Scanning ${tokens.length} known tokens for chain ${chainId}`);
  const results = [];

  // Batch in groups of 5 to avoid overwhelming RPC
  for (let i = 0; i < tokens.length; i += 5) {
    const batch = tokens.slice(i, i + 5);
    const batchResults = await Promise.allSettled(
      batch.map(async (token) => {
        try {
          const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
          const balance = await contract.balanceOf(address);
          if (balance > 0n) {
            const decimals = token.decimals;
            const formatted = ethers.formatUnits(balance, decimals);
            return {
              address: token.address.toLowerCase(),
              symbol: token.symbol,
              name: token.name,
              balance: formatted,
              balanceFormatted: formatted,
              decimals,
              value: null,
            };
          }
          return null;
        } catch (err) {
          logger.warn(`[RPC-scan] Failed to query ${token.symbol} (${token.address}): ${err.message}`);
          return null;
        }
      })
    );
    for (const r of batchResults) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value);
    }
  }

  logger.info(`[RPC-scan] Found ${results.length} tokens with balance on chain ${chainId}`);
  return results;
};

router.get('/', async (req, res) => {
  const { address, chainId } = req.query;
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] === BALANCE ROUTE ENTER ===`);  logger.info(`[${requestId}] ========== BALANCE API REQUEST START ==========`);
  
  logger.info(`[${requestId}] [Validation] ETHERSCAN_API_KEY validation: ${process.env.ETHERSCAN_API_KEY ? 'API key exists' : 'API key missing'}`);

  if (!address || !chainId) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Missing required query parameters: address, chainId',
    });
  }

  const isAddressValid = ethers.isAddress(address);
  logger.info(`[${requestId}] [Validation] Address ${address} is in valid checksummed format: ${isAddressValid}`);
  
  if (!isAddressValid) {
    return res.status(400).json({
      success: false,
      data: null,
      error: `Invalid wallet address: ${address}`,
    });
  }
  
  const checksummedAddress = ethers.getAddress(address);
  const chainIdNum = parseInt(chainId, 10);
  
  if (isNaN(chainIdNum)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: `Invalid chainId: ${chainId}. Must be a valid network ID.`,
    });
  }

  const rpcKey = CHAIN_ID_TO_RPC_KEY[chainIdNum];
  logger.info(`[${requestId}] [Validation] ChainId ${chainIdNum} maps to correct chain for Etherscan: ${rpcKey ? 'Yes (' + rpcKey + ')' : 'No'}`);

  const currencySymbol = CHAIN_ID_TO_CURRENCY[chainIdNum] || 'UNKNOWN';

  try {
    logger.info(`[${requestId}] BEFORE calling getTokenBalances():`);
    logger.info(`[${requestId}]   - address parameter: ${checksummedAddress}`);
    logger.info(`[${requestId}]   - chainId parameter: ${chainIdNum}`);
    
    const tokenBalances = await getTokenBalances(checksummedAddress, chainIdNum);
    
    logger.info(`[${requestId}] AFTER calling getTokenBalances():`);
    logger.info(`[${requestId}]   - raw tokens array returned: ${JSON.stringify(tokenBalances)}`);
    
    const isTokensNull = tokenBalances === null;
    const isTokensUndefined = tokenBalances === undefined;
    const isTokensEmpty = Array.isArray(tokenBalances) && tokenBalances.length === 0;
    
    logger.info(`[${requestId}]   - tokens array length: ${Array.isArray(tokenBalances) ? tokenBalances.length : 'N/A'}`);
    logger.info(`[${requestId}]   - is tokens null: ${isTokensNull}`);
    logger.info(`[${requestId}]   - is tokens undefined: ${isTokensUndefined}`);
    logger.info(`[${requestId}]   - is tokens empty: ${isTokensEmpty}`);
    
    if (Array.isArray(tokenBalances)) {
      tokenBalances.forEach((token, index) => {
        logger.info(`[${requestId}]   - Token [${index}]: Symbol=${token.symbol}, Balance=${token.balance}`);
      });
    }

    // Create provider once — reused for native balance and RPC token scan fallback
    let provider = null;
    const rpcKey2 = CHAIN_ID_TO_RPC_KEY[chainIdNum];
    if (rpcKey2 && RPC_ENDPOINTS[rpcKey2]) {
      provider = new ethers.JsonRpcProvider(RPC_ENDPOINTS[rpcKey2], chainIdNum);
    }

    let nativeBalance = null;
    try {
      logger.info(`[${requestId}] [Native Balance] Attempting to fetch. RPC Key: ${rpcKey2}`);
      logger.info(`[${requestId}] [Native Balance] RPC_ENDPOINTS keys available: ${Object.keys(RPC_ENDPOINTS).join(', ')}`);
      
      if (provider) {
        const rpcEndpoint = RPC_ENDPOINTS[rpcKey2];
        logger.info(`[${requestId}] [Native Balance] Using RPC endpoint: ${rpcEndpoint}`);
        
        let balanceWei;
        try {
          logger.info(`[${requestId}] [Native Balance] Calling provider.getBalance(${checksummedAddress})`);
          balanceWei = await provider.getBalance(checksummedAddress);
          logger.info(`[${requestId}] [Native Balance] Got balanceWei: ${balanceWei}, type: ${typeof balanceWei}`);
        } catch (getBalanceError) {
          logger.error(`[${requestId}] [Native Balance] Error occurred during provider.getBalance() call: ${getBalanceError.message}`);
          logger.error(`[${requestId}] [Native Balance] Stack trace: ${getBalanceError.stack}`);
          throw getBalanceError;
        }
        
        if (typeof balanceWei === 'bigint') {
          const balanceWeiString = balanceWei.toString();
          const balanceEth = ethers.formatEther(balanceWei);
          logger.info(`[${requestId}] [Native Balance] Successfully formatted: ${balanceEth} ETH (wei: ${balanceWeiString})`);
          
          nativeBalance = {
            address: checksummedAddress.toLowerCase(),
            balanceWei: balanceWeiString,
            balanceEth: balanceEth
          };
        } else {
          logger.warn(`[${requestId}] [Native Balance] balanceWei is not a bigint, type is: ${typeof balanceWei}`);
        }
      } else {
        logger.warn(`[${requestId}] [Native Balance] No RPC endpoint found for chainId ${chainIdNum}, rpcKey2: ${rpcKey2}`);
      }
    } catch (nativeErr) {
      logger.error(`[${requestId}] [Native Balance] Error fetching native balance: ${nativeErr.message}`);
      logger.error(`[${requestId}] [Native Balance] Stack trace: ${nativeErr.stack}`);
    }

    // RPC fallback: if explorer APIs returned no tokens and we have known tokens for this chain
    let finalTokens = tokenBalances;
    if ((!Array.isArray(tokenBalances) || tokenBalances.length === 0) && KNOWN_TOKENS[chainIdNum] && provider) {
      logger.info(`[${requestId}] [RPC-fallback] Explorer returned no tokens for chain ${chainIdNum}, scanning via RPC...`);
      try {
        const rpcTokens = await scanTokensViaRpc(checksummedAddress, chainIdNum, provider);
        if (rpcTokens.length > 0) {
          finalTokens = rpcTokens;
          logger.info(`[${requestId}] [RPC-fallback] Found ${rpcTokens.length} tokens via RPC scan`);
        }
      } catch (rpcErr) {
        logger.error(`[${requestId}] [RPC-fallback] RPC token scan failed: ${rpcErr.message}`);
      }
    }

    const responseData = {
      native: nativeBalance,
      tokens: finalTokens
    };
    
    const finalResponse = {
      success: true,
      data: responseData,
      error: null,
    };
    
    res.json(finalResponse);
  } catch (error) {
    logger.error(`[${requestId}] Error in balance route handler: ${error.message}`);
    logger.error(`[${requestId}] Stack trace: ${error.stack}`);
    
    res.status(500).json({
      success: false,
      data: null,
      error: {
        name: error.name,
        message: error.message,
      },
    });
  }
});

export default router;
