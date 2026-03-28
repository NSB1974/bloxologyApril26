
export const logContextState = (context) => {
  console.log('=========================================');
  console.log('[Debug] Context State:', context);
  console.log('=========================================');
};

export const logLocalStorage = () => {
  console.log('=========================================');
  const storage = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      storage[key] = JSON.parse(localStorage.getItem(key));
    } catch (e) {
      storage[key] = localStorage.getItem(key);
    }
  }
  console.log('[Debug] LocalStorage:', storage);
  console.log('=========================================');
};

export const logNetworkInfo = (network) => {
  console.log('=========================================');
  console.log('[Debug] Network Info:', network);
  console.log('=========================================');
};

export const logTokenList = (tokens) => {
  console.log('=========================================');
  console.log('[Debug] Token List (Custom):', tokens);
  console.log('=========================================');
};

export const logWalletState = (walletAddress, isConnected) => {
  console.log('=========================================');
  console.log('[Debug] Wallet State:', { walletAddress, isConnected });
  console.log('=========================================');
};
