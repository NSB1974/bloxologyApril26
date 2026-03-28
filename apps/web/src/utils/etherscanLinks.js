
export const getExplorerDomain = (network) => {
  if (!network) return 'etherscan.io';
  
  // Handle both network object and network ID
  const id = typeof network === 'object' ? network.id : parseInt(network);
  
  switch (id) {
    case 1: return 'etherscan.io';
    case 137: return 'polygonscan.com';
    case 8453: return 'basescan.org';
    case 42161: return 'arbiscan.io';
    case 10: return 'optimistic.etherscan.io';
    case 11155111: return 'sepolia.etherscan.io';
    case 250: return 'ftmscan.com';
    default: 
      // Fallback to checking name if id isn't matched
      const name = typeof network === 'object' ? network.name?.toLowerCase() : '';
      if (name?.includes('polygon')) return 'polygonscan.com';
      if (name?.includes('base')) return 'basescan.org';
      if (name?.includes('arbitrum')) return 'arbiscan.io';
      if (name?.includes('optimism')) return 'optimistic.etherscan.io';
      if (name?.includes('sepolia')) return 'sepolia.etherscan.io';
      if (name?.includes('fantom')) return 'ftmscan.com';
      return 'etherscan.io';
  }
};

export const getTransactionUrl = (hash, network) => {
  if (!hash) return '#';
  const domain = getExplorerDomain(network);
  return `https://${domain}/tx/${hash}`;
};

export const getAddressUrl = (address, network) => {
  if (!address) return '#';
  const domain = getExplorerDomain(network);
  return `https://${domain}/address/${address}`;
};

export const getTokenUrl = (tokenAddress, network) => {
  if (!tokenAddress) return '#';
  const domain = getExplorerDomain(network);
  return `https://${domain}/token/${tokenAddress}`;
};

export const getBlockUrl = (blockNumber, network) => {
  if (!blockNumber) return '#';
  const domain = getExplorerDomain(network);
  return `https://${domain}/block/${blockNumber}`;
};
