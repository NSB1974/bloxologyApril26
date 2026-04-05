export const BLOXOLOGY_TOKENS_BY_CHAIN = {
  8453: [
    {
      symbol: 'ETH',
      name: 'Wrapped Ether',
      address: '0x4200000000000000000000000000000000000006',
      decimals: 18,
      logoURI: '/token-logos/base/weth.png',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      decimals: 6,
      logoURI: '/token-logos/base/usdc.png',
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      decimals: 18,
      logoURI: '/token-logos/base/dai.png',
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      decimals: 6,
      logoURI: '/token-logos/base/usdt.png',
    },
  ],
  1: [
    {
      symbol: 'ETH',
      name: 'Wrapped Ether',
      address: '0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2',
      decimals: 18,
      logoURI: '/token-logos/ethereum/weth.png',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      logoURI: '/token-logos/ethereum/usdc.png',
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      decimals: 18,
      logoURI: '/token-logos/ethereum/dai.png',
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
      logoURI: '/token-logos/ethereum/usdt.png',
    },
  ],
};

export const getBloxologyTokensForChain = (chainId) => {
  return BLOXOLOGY_TOKENS_BY_CHAIN[Number(chainId)] || BLOXOLOGY_TOKENS_BY_CHAIN[8453];
};
