import { createConfig, http } from '@wagmi/core';
import { mainnet, polygon, base, baseSepolia, arbitrum, optimism, sepolia } from 'wagmi/chains';
import { injected, coinbaseWallet } from '@wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia, mainnet, polygon, arbitrum, optimism, sepolia],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: 'Bloxology',
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http('https://mainnet.base.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [polygon.id]: http('https://polygon-rpc.com'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    [optimism.id]: http('https://mainnet.optimism.io'),
    [sepolia.id]: http('https://rpc.sepolia.org'),
  },
});
