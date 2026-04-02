module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, data: null, error: 'Method not allowed' });
  }

  const { fromToken, toToken, amount } = req.body || {};
  if (!fromToken || !toToken || !amount) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Missing required body parameters: fromToken, toToken, amount',
    });
  }

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ success: false, data: null, error: 'Invalid amount' });
  }

  const exchangeRate = 0.9975;
  const outputAmount = (parsedAmount * exchangeRate).toFixed(6);
  const gasFee = '0.0002';
  const slippage = '0.50';

  return res.status(200).json({
    success: true,
    data: {
      outputAmount,
      exchangeRate: exchangeRate.toFixed(6),
      gasFee,
      slippage,
    },
    error: null,
  });
};
