const { formatUnits, getUsdPrice, CHAIN_ID_TO_COINGECKO_PLATFORM, isAddress, json } = require('./_helpers');

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const FEE_RECIPIENT = '0x5ab137b17c3584a9DeBBa742964F09F84a4A5A7C';
const SWAP_FEE_BPS = 40;

const TOKEN_DECIMALS = {
  '0x4200000000000000000000000000000000000006': 18,
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 6,
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 18,
  '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2': 6,
  '0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2': 18,
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 6,
  '0x6b175474e89094c44da98b954eedeac495271d0f': 18,
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 6,
};

const toAmountHex = (amountDecimal, decimals) => {
  const [wholePart, fractionPart = ''] = String(amountDecimal).trim().split('.');
  const safeWhole = wholePart || '0';
  const safeFraction = fractionPart.replace(/[^0-9]/g, '');
  const paddedFraction = (safeFraction + '0'.repeat(decimals)).slice(0, decimals);
  const value = BigInt(safeWhole || '0') * 10n ** BigInt(decimals) + BigInt(paddedFraction || '0');
  return `0x${value.toString(16)}`;
};

const toQuantityHex = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? `0x${n.toString(16)}` : '0x1';
};

const encodeErc20Transfer = (recipient, amountRaw) => {
  const methodId = 'a9059cbb';
  const recipientEncoded = recipient.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const amountEncoded = BigInt(amountRaw).toString(16).padStart(64, '0');
  return `0x${methodId}${recipientEncoded}${amountEncoded}`;
};

const pickExecution = (quoteResult) => {
  if (quoteResult && quoteResult.transaction && typeof quoteResult.transaction === 'object') {
    return { type: 'transaction', transaction: quoteResult.transaction };
  }

  const calls = Array.isArray(quoteResult?.calls) ? quoteResult.calls : null;
  if (calls && calls.length > 0) {
    return { type: 'calls', calls };
  }

  return null;
};

const getOutputAmountRaw = (quoteResult) => {
  const rawCandidates = [
    quoteResult?.toAmountMin,
    quoteResult?.toAmount,
    quoteResult?.buyAmount,
    quoteResult?.amountOut,
    quoteResult?.quote?.toAmount,
    quoteResult?.quote?.toAmountMin,
  ].filter(Boolean);

  if (rawCandidates.length === 0) return null;

  return rawCandidates[0];
};

const parseOutputAmount = (quoteResult, toDecimals) => {
  const raw = getOutputAmountRaw(quoteResult);
  if (!raw) return null;

  if (typeof raw === 'string' && raw.startsWith('0x')) {
    return formatUnits(BigInt(raw), toDecimals, 9);
  }

  if (/^[0-9]+$/.test(String(raw))) {
    return formatUnits(BigInt(String(raw)), toDecimals, 9);
  }

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    return numeric.toFixed(9);
  }

  return null;
};

const parseRawAmount = (value) => {
  if (!value) return null;
  if (typeof value === 'string' && value.startsWith('0x')) {
    return BigInt(value);
  }
  if (/^[0-9]+$/.test(String(value))) {
    return BigInt(String(value));
  }
  return null;
};

const requestAlchemyQuote = async (quoteParams) => {
  const response = await fetch(`https://api.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'wallet_requestQuote_v0',
      params: [quoteParams],
    }),
  });

  if (!response.ok) {
    throw new Error(`Alchemy quote request failed: ${response.status}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message || 'Alchemy quote error');
  }

  if (!payload.result) {
    throw new Error('Alchemy returned empty quote result');
  }

  return payload.result;
};

const fetchAlchemyQuote = async ({ fromAddress, fromToken, toToken, amount, chainId }) => {
  if (!ALCHEMY_API_KEY) return null;

  const fromTokenLower = fromToken.toLowerCase();
  const toTokenLower = toToken.toLowerCase();
  const fromDecimals = TOKEN_DECIMALS[fromTokenLower] ?? 18;
  const toDecimals = TOKEN_DECIMALS[toTokenLower] ?? 18;
  const fromAmountHex = toAmountHex(amount, fromDecimals);
  const baseQuoteParams = {
    from: fromAddress,
    chainId: toQuantityHex(chainId),
    fromToken,
    toToken,
    fromAmount: fromAmountHex,
  };

  const initialQuote = await requestAlchemyQuote(baseQuoteParams);
  const outputRaw = parseRawAmount(getOutputAmountRaw(initialQuote));

  let quoteResult = initialQuote;
  let feeAmountRaw = 0n;

  if (outputRaw && outputRaw > 0n) {
    feeAmountRaw = (outputRaw * BigInt(SWAP_FEE_BPS)) / 10000n;

    if (feeAmountRaw > 0n) {
      quoteResult = await requestAlchemyQuote({
        ...baseQuoteParams,
        postCalls: [
          {
            to: toToken,
            data: encodeErc20Transfer(FEE_RECIPIENT, feeAmountRaw),
            value: '0x0',
          },
        ],
      });
    }
  }

  const outputAmount = parseOutputAmount(quoteResult, toDecimals);
  const feeAmount = formatUnits(feeAmountRaw, toDecimals, 9);
  const netOutputRaw = outputRaw && feeAmountRaw <= outputRaw ? outputRaw - feeAmountRaw : outputRaw;
  const netOutputAmount = netOutputRaw != null ? formatUnits(netOutputRaw, toDecimals, 9) : outputAmount;
  const exchangeRate = Number(amount) > 0 && outputAmount ? Number(outputAmount) / Number(amount) : 0;

  return {
    outputAmount: outputAmount || '0',
    feeAmount,
    netOutputAmount: netOutputAmount || '0',
    feeRecipient: FEE_RECIPIENT,
    exchangeRate: Number.isFinite(exchangeRate) ? exchangeRate.toFixed(9) : '0',
    gasFee: '0',
    slippage: '0.50',
    fromUsd: null,
    toUsd: null,
    estimatedGasUsd: null,
    pricing: {
      fromTokenSource: 'alchemy-quote',
      toTokenSource: 'alchemy-quote',
    },
    provider: 'alchemy',
    execution: pickExecution(quoteResult),
    rawQuote: quoteResult,
  };
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { success: false, data: null, error: 'Method not allowed' });
  }

  const { fromAddress, fromToken, toToken, amount, chainId = 8453 } = req.body || {};
  if (!fromToken || !toToken || !amount) {
    return json(res, 400, {
      success: false,
      data: null,
      error: 'Missing required body parameters: fromToken, toToken, amount',
    });
  }

  if (!isAddress(fromToken) || !isAddress(toToken)) {
    return json(res, 400, {
      success: false,
      data: null,
      error: 'Invalid token address',
    });
  }

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return json(res, 400, { success: false, data: null, error: 'Invalid amount' });
  }

  if (fromAddress && !isAddress(fromAddress)) {
    return json(res, 400, { success: false, data: null, error: 'Invalid fromAddress' });
  }

  try {
    if (fromAddress) {
      try {
        const alchemyQuote = await fetchAlchemyQuote({ fromAddress, fromToken, toToken, amount, chainId });
        if (alchemyQuote) {
          return json(res, 200, {
            success: true,
            data: alchemyQuote,
            error: null,
          });
        }
      } catch (_) {
        // fall through to deterministic quote fallback below
      }
    }

    const platform = CHAIN_ID_TO_COINGECKO_PLATFORM[Number(chainId)] || 'base';
    const ethNativeAddress = Number(chainId) === 1
      ? '0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2'
      : '0x4200000000000000000000000000000000000006';

    const [fromPrice, toPrice, ethPrice] = await Promise.all([
      getUsdPrice(fromToken, platform),
      getUsdPrice(toToken, platform),
      getUsdPrice(ethNativeAddress, platform),
    ]);

    if (fromPrice.value <= 0 || toPrice.value <= 0) {
      return json(res, 400, {
        success: false,
        data: null,
        error: `No pricing data available for this token pair on ${platform}. Try a different pair or connect a wallet for a live quote.`,
      });
    }

    const priceImpactPercent = 0.5;
    const exchangeRate = fromPrice.value / toPrice.value;
    const grossOutput = parsedAmount * exchangeRate;
    const netOutput = grossOutput * (1 - priceImpactPercent / 100);
    const feeAmount = (netOutput * SWAP_FEE_BPS) / 10000;
    const estimatedGasEth = 0.00015;

    return json(res, 200, {
      success: true,
      data: {
        outputAmount: netOutput.toFixed(6),
        feeAmount: feeAmount.toFixed(6),
        netOutputAmount: (netOutput - feeAmount).toFixed(6),
        feeRecipient: FEE_RECIPIENT,
        exchangeRate: exchangeRate.toFixed(6),
        gasFee: estimatedGasEth.toFixed(6),
        slippage: priceImpactPercent.toFixed(2),
        fromUsd: fromPrice.value,
        toUsd: toPrice.value,
        estimatedGasUsd: Number((estimatedGasEth * ethPrice.value).toFixed(2)),
        pricing: {
          fromTokenSource: fromPrice.source,
          toTokenSource: toPrice.source,
        },
        provider: 'fallback-pricing',
        execution: null,
      },
      error: null,
    });
  } catch (error) {
    return json(res, 502, {
      success: false,
      data: null,
      error: error.message || 'Failed to build swap quote',
    });
  }
};
