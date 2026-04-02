module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, data: null, error: 'Method not allowed' });
  }

  const walletAddress = req.query && req.query.walletAddress;
  const tokenAddress = req.query && req.query.tokenAddress;

  if (!walletAddress || !tokenAddress) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Missing required query parameters: walletAddress, tokenAddress',
    });
  }

  const isAddress = /^0x[a-fA-F0-9]{40}$/.test(walletAddress) && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress);
  if (!isAddress) {
    return res.status(400).json({ success: false, data: null, error: 'Invalid Ethereum address' });
  }

  return res.status(200).json({
    success: true,
    data: {
      balance: '0',
      symbol: 'TOKEN',
      decimals: 18,
      tokenAddress,
      walletAddress,
    },
    error: null,
  });
};
