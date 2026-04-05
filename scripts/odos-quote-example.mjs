const quoteUrl = 'https://enterprise-api.odos.xyz/sor/quote/v3';

const quoteRequestBody = {
  chainId: 8453,
  inputTokens: [
    {
      tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      amount: '10000000'
    }
  ],
  outputTokens: [
    {
      tokenAddress: '0xca73ed1815e5915489570014e024b7EbE65dE679',
      proportion: 1
    }
  ],
  userAddr: '0x...',
  slippageLimitPercent: 0.3,
  partnerFeePercent: 0.001,  // 0.1% fee
  feeRecipient: '0x...',  // Your recipient address
  compact: true
};

const response = await fetch(quoteUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ODOS_API_KEY
  },
  body: JSON.stringify(quoteRequestBody)
});

const quote = await response.json();
console.log(quote);