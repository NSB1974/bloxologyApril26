import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

// Map common token symbols to CoinGecko IDs
const SYMBOL_TO_COINGECKO_ID = {
  ETH: 'ethereum',
  BTC: 'bitcoin',
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  WETH: 'ethereum',
  WBTC: 'wrapped-bitcoin',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  AAVE: 'aave',
  UNI: 'uniswap',
  SUSHI: 'sushi',
  CURVE: 'curve-dao-token',
  YEARN: 'yearn-finance',
  COMP: 'compound-governance-token',
  MKR: 'maker',
  SNX: 'synthetix-network-token',
  GRT: 'the-graph',
  ENS: 'ethereum-name-service',
  OP: 'optimism',
  ARB: 'arbitrum',
  AVAX: 'avalanche-2',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  SHIB: 'shiba-inu',
};

// Map timeframe to CoinGecko days parameter
const TIMEFRAME_TO_DAYS = {
  '1h': 1,
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '1y': 365,
};

// Helper function to resolve token ID
const resolveTokenId = (symbol) => {
  const upperSymbol = symbol.toUpperCase();
  if (SYMBOL_TO_COINGECKO_ID[upperSymbol]) {
    return SYMBOL_TO_COINGECKO_ID[upperSymbol];
  }
  // If it's a contract address or unknown symbol, return as-is
  // CoinGecko will handle validation
  return symbol.toLowerCase();
};

// Helper function to validate Ethereum address format
const isEthereumAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Helper function to fetch data from CoinGecko
const fetchCoinGeckoData = async (coinId, days) => {
  const baseUrl = 'https://api.coingecko.com/api/v3';

  // Fetch current market data
  const marketDataUrl = `${baseUrl}/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_high_low_24h=true`;
  const marketResponse = await fetch(marketDataUrl);

  if (!marketResponse.ok) {
    throw new Error(`CoinGecko API error: ${marketResponse.status} ${marketResponse.statusText}`);
  }

  const marketData = await marketResponse.json();

  if (!marketData[coinId]) {
    throw new Error(`Token not found on CoinGecko: ${coinId}`);
  }

  // Fetch historical price data
  const historyUrl = `${baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
  const historyResponse = await fetch(historyUrl);

  if (!historyResponse.ok) {
    throw new Error(`CoinGecko API error: ${historyResponse.status} ${historyResponse.statusText}`);
  }

  const historyData = await historyResponse.json();

  return { marketData: marketData[coinId], historyData };
};

router.post('/', async (req, res) => {
  const { symbol, timeframe } = req.body;

  // Validate required fields
  if (!symbol || !timeframe) {
    return res.status(400).json({
      error: 'Missing required fields: symbol, timeframe',
    });
  }

  // Validate timeframe
  if (!TIMEFRAME_TO_DAYS[timeframe]) {
    return res.status(400).json({
      error: `Invalid timeframe: ${timeframe}. Supported timeframes: ${Object.keys(TIMEFRAME_TO_DAYS).join(', ')}`,
    });
  }

  // Validate symbol format (must be 1-20 characters, alphanumeric or address)
  if (typeof symbol !== 'string' || symbol.length === 0 || symbol.length > 100) {
    return res.status(400).json({
      error: 'Invalid symbol: must be a non-empty string (token symbol or contract address)',
    });
  }

  // Resolve token ID from symbol or use as-is if it's a contract address
  const tokenId = resolveTokenId(symbol);
  const days = TIMEFRAME_TO_DAYS[timeframe];

  logger.info(`Fetching price chart for ${symbol} (${tokenId}) with timeframe ${timeframe}`);

  // Fetch data from CoinGecko
  const { marketData, historyData } = await fetchCoinGeckoData(tokenId, days);

  // Extract current price and metrics
  const currentPrice = marketData.usd || 0;
  const priceChange24h = marketData.usd_24h_change || 0;
  const priceChangePercent24h = priceChange24h;
  const high24h = marketData.usd_24h_high || 0;
  const low24h = marketData.usd_24h_low || 0;
  const marketCap = marketData.usd_market_cap || 0;
  const volume24h = marketData.usd_24h_vol || 0;

  // Process historical price data
  const chartData = historyData.prices.map(([timestamp, price]) => ({
    timestamp: new Date(timestamp).toISOString(),
    price: parseFloat(price.toFixed(8)),
  }));

  logger.info(`Price chart fetched successfully for ${symbol}`);

  res.json({
    symbol: symbol.toUpperCase(),
    currentPrice: parseFloat(currentPrice.toFixed(8)),
    priceChange24h: parseFloat(priceChange24h.toFixed(8)),
    priceChangePercent24h: parseFloat(priceChangePercent24h.toFixed(2)),
    high24h: parseFloat(high24h.toFixed(8)),
    low24h: parseFloat(low24h.toFixed(8)),
    marketCap: marketCap ? parseFloat(marketCap.toFixed(2)) : null,
    volume24h: volume24h ? parseFloat(volume24h.toFixed(2)) : null,
    chartData,
  });
});

export default router;
