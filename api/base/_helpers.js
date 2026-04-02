const BASE_RPC_ENDPOINT = process.env.BASE_RPC_ENDPOINT || 'https://base-rpc.publicnode.com';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3/simple/price';

const PRICE_CACHE_TTL_MS = 60 * 1000;
const TOKEN_META_CACHE_TTL_MS = 10 * 60 * 1000;

const priceCache = new Map();
const tokenMetaCache = new Map();

const TOKEN_PRICE_IDS = {
  '0x4200000000000000000000000000000000000006': 'ethereum',
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'usd-coin',
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 'dai',
  '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2': 'tether',
};

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const isAddress = (value) => /^0x[a-fA-F0-9]{40}$/.test(value || '');

const nowMs = () => Date.now();

const shouldUseCache = (cached, ttlMs) => cached && nowMs() - cached.ts < ttlMs;

const rpc = async (method, params) => {
  const response = await fetch(BASE_RPC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Base RPC request failed: ${response.status}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message || 'Base RPC returned an error');
  }

  return payload.result;
};

const hexToBigInt = (hex) => {
  if (!hex || hex === '0x') return 0n;
  return BigInt(hex);
};

const formatUnits = (value, decimals, precision = 6) => {
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = value % divisor;

  if (precision <= 0) return whole.toString();

  const fullFraction = fraction.toString().padStart(decimals, '0');
  const trimmed = fullFraction.slice(0, precision).replace(/0+$/, '');
  return trimmed ? `${whole.toString()}.${trimmed}` : whole.toString();
};

const decodeAbiString = (hexData) => {
  if (!hexData || hexData === '0x') return 'UNKNOWN';
  const raw = hexData.startsWith('0x') ? hexData.slice(2) : hexData;

  try {
    if (raw.length >= 128) {
      const length = parseInt(raw.slice(64, 128), 16);
      const strHex = raw.slice(128, 128 + length * 2);
      const decoded = Buffer.from(strHex, 'hex').toString('utf8').replace(/\u0000/g, '').trim();
      if (decoded) return decoded;
    }
  } catch (_) {
    // Try bytes32 fallback below
  }

  try {
    const bytes32 = raw.slice(0, 64);
    const decoded = Buffer.from(bytes32, 'hex').toString('utf8').replace(/\u0000/g, '').trim();
    return decoded || 'UNKNOWN';
  } catch (_) {
    return 'UNKNOWN';
  }
};

const getTokenMeta = async (tokenAddress) => {
  const key = tokenAddress.toLowerCase();
  const cached = tokenMetaCache.get(key);
  if (shouldUseCache(cached, TOKEN_META_CACHE_TTL_MS)) {
    return cached.value;
  }

  const [decimalsHex, symbolHex] = await Promise.all([
    rpc('eth_call', [{ to: tokenAddress, data: '0x313ce567' }, 'latest']),
    rpc('eth_call', [{ to: tokenAddress, data: '0x95d89b41' }, 'latest']),
  ]);

  const decimals = Number.parseInt(decimalsHex, 16);
  const symbol = decodeAbiString(symbolHex);

  const value = {
    decimals: Number.isFinite(decimals) ? decimals : 18,
    symbol,
  };
  tokenMetaCache.set(key, { ts: nowMs(), value });
  return value;
};

const getErc20Balance = async (walletAddress, tokenAddress) => {
  const { decimals, symbol } = await getTokenMeta(tokenAddress);
  const paddedWallet = walletAddress.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const balanceHex = await rpc(
    'eth_call',
    [{ to: tokenAddress, data: `0x70a08231${paddedWallet}` }, 'latest']
  );
  const balanceRaw = hexToBigInt(balanceHex);

  return {
    balanceRaw,
    balance: formatUnits(balanceRaw, decimals),
    decimals,
    symbol,
  };
};

const getNativeBalance = async (walletAddress) => {
  const result = await rpc('eth_getBalance', [walletAddress, 'latest']);
  const balanceRaw = hexToBigInt(result);
  return {
    balanceRaw,
    balance: formatUnits(balanceRaw, 18),
    decimals: 18,
    symbol: 'ETH',
  };
};

const getUsdPrice = async (tokenAddress) => {
  const key = tokenAddress.toLowerCase();
  const id = TOKEN_PRICE_IDS[key];
  if (!id) return 0;

  const cached = priceCache.get(id);
  if (shouldUseCache(cached, PRICE_CACHE_TTL_MS)) {
    return cached.value;
  }

  const url = `${COINGECKO_BASE}?ids=${encodeURIComponent(id)}&vs_currencies=usd`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`CoinGecko request failed: ${response.status}`);
  }

  const payload = await response.json();
  const value = Number(payload?.[id]?.usd || 0);
  priceCache.set(id, { ts: nowMs(), value });
  return value;
};

module.exports = {
  TOKEN_PRICE_IDS,
  getErc20Balance,
  getNativeBalance,
  getUsdPrice,
  isAddress,
  json,
};