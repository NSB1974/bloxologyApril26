
# Portfolio & Balance Checker Testing Checklist

Follow these steps to verify the portfolio, custom networks, and custom tokens functionality. Open your browser's Developer Tools (F12) and keep the Console tab open to monitor the debug logs.

## 1. Test Default Network (Base Mainnet)
- [ ] **Action**: Load the application and connect your wallet. Ensure "Base Mainnet" is selected.
- [ ] **Expected Result**: The Dashboard should display your native ETH balance on Base.
- [ ] **Console Check**: Look for `[TokenBalanceChecker] Fetching balances with payload:` and verify `network: "base"` and `address` are correct. Verify `[TokenBalanceChecker] API Response:` contains `nativeBalance`.

## 2. Test Custom Network Addition
- [ ] **Action**: Go to Settings -> Network Selection -> Manage -> Add Network.
- [ ] **Input**: 
  - Name: `Arbitrum One`
  - RPC URL: `https://arb1.arbitrum.io/rpc`
  - Chain ID: `42161`
  - Currency Symbol: `ETH`
- [ ] **Expected Result**: Network is added successfully and appears in the Custom Networks list.
- [ ] **Console Check**: Look for `[CustomNetworkManager] Saving network to localStorage` and verify the JSON payload.

## 3. Test Custom Token Addition & Balance Display
- [ ] **Action**: Switch to Ethereum Mainnet. Go to Settings -> Custom Tokens -> Add Token.
- [ ] **Input**: 
  - Address: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` (USDC)
- [ ] **Expected Result**: Token details (USDC, 6 decimals) should auto-fill. Save it. The Dashboard should now display the USDC balance.
- [ ] **Console Check**: Look for `[CustomTokenManager] Saving token to localStorage`. In the Dashboard, look for `[TokenBalanceChecker] API Response:` and verify `tokenBalances` contains the USDC address with a raw string value.

## 4. Test Address Switching
- [ ] **Action**: In the Dashboard, use the Address Switcher to change the active account.
- [ ] **Expected Result**: The Portfolio balances should immediately update to reflect the new address.
- [ ] **Console Check**: Look for `[BaseAuthContext] State updated: walletAddress changed`. Verify `[TokenBalanceChecker]` fires a new fetch request with the new address.

## 5. Test Network Switching
- [ ] **Action**: Switch between Base Mainnet and Ethereum Mainnet.
- [ ] **Expected Result**: The Portfolio should clear the previous network's tokens and fetch the native balance and custom tokens for the newly selected network.
- [ ] **Console Check**: Look for `[BaseAuthContext] State updated: selectedNetwork changed`.

## 6. Test LocalStorage Persistence
- [ ] **Action**: Refresh the page (F5).
- [ ] **Expected Result**: Your connected wallet, selected network, custom networks, and custom tokens should all remain intact.
- [ ] **Console Check**: Look for `[BaseAuthContext] Initializing state from localStorage...` and verify the parsed data.

## 7. Test Error Handling
- [ ] **Action**: Add a custom network with an invalid RPC URL (e.g., `https://invalid.rpc.com`).
- [ ] **Expected Result**: The form should show a validation error toast.
- [ ] **Action**: Add a custom token with a random invalid address (e.g., `0x123...`).
- [ ] **Expected Result**: The form should reject the invalid address format.
- [ ] **Console Check**: Look for `[TokenBalanceChecker] API Error:` if a network request fails.

## 8. Test Empty Portfolio State
- [ ] **Action**: Select a network where you have 0 native balance and no custom tokens added.
- [ ] **Expected Result**: The native balance should show `0.0000`. A message saying "No custom tokens tracked on this network" should be displayed.
