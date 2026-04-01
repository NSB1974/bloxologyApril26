# Foundry Quick Reference

## Installation Status ✅
- **forge** version 1.5.1
- **cast** version 1.5.1
- **anvil** installed for local testing
- **chisel** REPL available

## Project Setup ✅
- Foundry project initialized in `/contracts`
- Located: `/Users/sarahbarker/Desktop/Bloxologyweb/bloxology/contracts`
- Base network RPC endpoints configured
- BaseScan API key template in `.env.example`

## Quick Commands

### Compile
```bash
cd contracts && forge build
```

### Test
```bash
cd contracts && forge test
```

### Deploy to Base Sepolia
```bash
cd contracts && forge create src/Counter.sol:Counter \
  --rpc-url https://sepolia.base.org \
  --account bloxology \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### Deploy to Base Mainnet
```bash
cd contracts && forge create src/Counter.sol:Counter \
  --rpc-url https://mainnet.base.org \
  --account bloxology \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## Setup Steps Remaining

1. **Set up wallet keystore**
   ```bash
   cast wallet import bloxology --keystore ~/.foundry/keystores/
   ```

2. **Get testnet ETH** (for Base Sepolia)
   - Visit: https://portal.cdp.coinbase.com/products/faucet
   - Claim ETH to your wallet address

3. **Get BaseScan API key**
   - Visit: https://basescan.org/apidashboard
   - Create new API key
   - Add to `.env`: `ETHERSCAN_API_KEY=your-key`

4. **Deploy!**
   - Once wallet and API key are set up, use deploy commands above

## Files Added
- `/contracts/foundry.toml` - Base network configuration
- `/contracts/.env.example` - Environment template
- `/contracts/DEPLOYMENT.md` - Full deployment guide
- `/contracts/QUICKREF.md` - This file

## Useful Links
- **Foundry Docs**: https://book.getfoundry.sh/
- **Base Docs**: https://docs.base.org
- **BaseScan**: https://basescan.org
- **Base Sepolia**: https://sepolia.basescan.org
- **CDP Faucet**: https://portal.cdp.coinbase.com/products/faucet

## Next: Complete Foundry Setup

Follow the guide in `/contracts/DEPLOYMENT.md` to:
1. Import your wallet
2. Get testnet ETH
3. Get BaseScan API key
4. Deploy your first contract

---
**Status**: Ready for contract development and deployment! 🚀
