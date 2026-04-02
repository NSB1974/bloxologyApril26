module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const walletAddress = req.query && req.query.walletAddress;
  if (!walletAddress) {
    return res.status(400).json({ success: false, data: null, error: 'Missing required query parameter: walletAddress' });
  }

  const isAddress = /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
  if (!isAddress) {
    return res.status(400).json({ success: false, data: null, error: 'Invalid Ethereum address' });
  }

  // Fallback JSON payload to keep UI functional in static-only deployment.
  const balances = [
    { token: 'ETH', balance: '0', price: 0, value: 0 },
    { token: 'USDC', balance: '0', price: 1, value: 0 },
    { token: 'DAI', balance: '0', price: 1, value: 0 },
    { token: 'USDT', balance: '0', price: 1, value: 0 },
  ];

  return res.status(200).json({
    success: true,
    data: { balances },
    error: null,
  });
};
