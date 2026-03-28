
export const getWalletProvider = (walletName) => {
  if (typeof window === 'undefined') return null;

  if (walletName === 'metamask') {
    // Handle cases where multiple injected providers exist
    if (window.ethereum?.providers) {
      return window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum;
    }
    return window.ethereum?.isMetaMask ? window.ethereum : window.ethereum;
  }

  if (walletName === 'coinbase') {
    if (window.coinbaseWalletExtension) {
      return window.coinbaseWalletExtension;
    }
    if (window.ethereum?.providers) {
      return window.ethereum.providers.find(p => p.isCoinbaseWallet) || window.ethereum;
    }
    return window.ethereum?.isCoinbaseWallet ? window.ethereum : null;
  }

  return null;
};

export const generateNonce = () => {
  return Date.now().toString();
};

export const requestSignature = async (provider, message, address) => {
  if (!provider) throw new Error('Wallet provider not found');
  if (!address) throw new Error('Wallet address is required for signing');

  try {
    // Convert message to hex using TextEncoder for browser compatibility
    const encoder = new TextEncoder();
    const bytes = encoder.encode(message);
    const hexMessage = '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const signature = await provider.request({
      method: 'personal_sign',
      params: [hexMessage, address],
    });
    
    return signature;
  } catch (error) {
    console.error('Signature request failed:', error);
    throw error;
  }
};

export const switchNetwork = async (provider, network) => {
  if (!provider) throw new Error('Wallet provider not found');
  if (!network || !network.id) throw new Error('Invalid network details provided');

  const chainIdHex = `0x${network.id.toString(16)}`;

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
    return true;
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainIdHex,
              chainName: network.name,
              rpcUrls: [network.rpcUrl],
              nativeCurrency: {
                name: network.currencySymbol || 'ETH',
                symbol: network.currencySymbol || 'ETH',
                decimals: 18,
              },
              blockExplorerUrls: network.blockExplorer ? [network.blockExplorer] : [],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add network to wallet:', addError);
        throw new Error(addError.message || 'Failed to add network to wallet');
      }
    } else {
      console.error('Failed to switch network in wallet:', switchError);
      throw new Error(switchError.message || 'Failed to switch network in wallet');
    }
  }
};
