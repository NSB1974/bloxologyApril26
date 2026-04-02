const { getUsdPrice, isAddress, json } = require('./_helpers');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { success: false, data: null, error: 'Method not allowed' });
  }

  const { fromToken, toToken, amount } = req.body || {};
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

  try {
    const [fromPrice, toPrice, ethPrice] = await Promise.all([
      getUsdPrice(fromToken),
      getUsdPrice(toToken),
      getUsdPrice('0x4200000000000000000000000000000000000006'),
    ]);

    if (fromPrice <= 0 || toPrice <= 0) {
      return json(res, 400, {
        success: false,
        data: null,
        error: 'Unsupported token for pricing',
      });
    }

    const priceImpactPercent = 0.5;
    const exchangeRate = fromPrice / toPrice;
    const grossOutput = parsedAmount * exchangeRate;
    const netOutput = grossOutput * (1 - priceImpactPercent / 100);
    const estimatedGasEth = 0.00015;

    return json(res, 200, {
      success: true,
      data: {
        outputAmount: netOutput.toFixed(6),
        exchangeRate: exchangeRate.toFixed(6),
        gasFee: estimatedGasEth.toFixed(6),
        slippage: priceImpactPercent.toFixed(2),
        fromUsd: fromPrice,
        toUsd: toPrice,
        estimatedGasUsd: Number((estimatedGasEth * ethPrice).toFixed(2)),
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
