# Foundry Smart Contract Deployment Guide

This directory contains Solidity smart contracts for Bloxology, ready to be deployed to Base L2 using Foundry.

## Prerequisites

1. **Foundry installed**
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   source ~/.zshenv
   foundryup
   ```

2. **Environment variables set up**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

## Quick Start

### 1. Set Up Your Wallet

**Option A: Using `cast wallet import` (recommended - encrypted storage)**
```bash
cast wallet import bloxology --keystore ~/.foundry/keystores/
# Enter your private key when prompted
# Enter password for encryption
```

Then update `foundry.toml` to use: `--account bloxology`

**Option B: Using environment variable (for CI/CD only)**
```bash
export PRIVATE_KEY=0x...your-private-key...
```

### 2. Get Test ETH

For **Base Sepolia** testnet:
1. Go to [CDP Faucet](https://portal.cdp.coinbase.com/products/faucet)
2. Sign in or create account
3. Select **Base Sepolia** network
4. Select **ETH** token
5. Enter your wallet address and claim
6. Verify on [sepolia.basescan.org](https://sepolia.basescan.org)

### 3. Get BaseScan API Key

1. Go to [basescan.org/apidashboard](https://basescan.org/apidashboard)
2. Sign in or create account (same as Etherscan)
3. Click **Add** to create new API key
4. Copy key and add to `.env`:
   ```bash
   ETHERSCAN_API_KEY=your-basescan-key
   ```

## Deployment Commands

### Deploy to Base Sepolia (Testnet)

```bash
# Using keystore
forge create src/Counter.sol:Counter \
  --rpc-url https://sepolia.base.org \
  --account bloxology \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY

# OR using private key from environment
forge create src/Counter.sol:Counter \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### Deploy to Base Mainnet

```bash
# Using keystore
forge create src/Counter.sol:Counter \
  --rpc-url https://mainnet.base.org \
  --account bloxology \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## Build & Testing

```bash
# Compile contracts
forge build

# Run tests
forge test

# Run with verbosity (-v through -vvvv for more detail)
forge test -vvv

# Run specific test
forge test --match-test testIncrementn

# Gas report
forge test --gas-report
```

## Contract Verification

Automatic verification during deployment with `--verify` flag (included in commands above).

To manually verify after deployment:

```bash
forge verify-contract <contract-address> src/Counter.sol:Counter \
  --rpc-url https://sepolia.base.org \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## Project Structure

```
contracts/
├── foundry.toml          # Foundry configuration for Base networks
├── .env.example          # Environment variable template
├── src/                  # Solidity source files
├── test/                 # Test files
├── script/               # Deployment scripts
└── lib/                  # Dependencies (forge-std, OpenZeppelin, etc.)
```

## Key Security Practices

1. **Never commit `.env`** - already in .gitignore
2. **Use keystore for mainnet** - `cast wallet import` encrypts your key
3. **API keys in environment** - don't hardcode in files
4. **Verify contracts** - always use `--verify` for transparency
5. **Test extensively** - run full test suite before deployment

## Explorer Links

- **Base Mainnet** Transactions: https://basescan.org/
- **Base Sepolia** Transactions: https://sepolia.basescan.org/
- **Foundry Docs**: https://book.getfoundry.sh/
- **CDP Faucet**: https://portal.cdp.coinbase.com/products/faucet

## Troubleshooting

### Issue: "nonce has already been used"
**Solution**: Node might be syncing. Wait a moment and retry.

### Issue: "insufficient funds for gas"
**Solution**: Get more testnet ETH from CDP Faucet.

### Issue: Verification 403 error
**Solution**: Check that `ETHERSCAN_API_KEY` is set and valid.

### Issue: "rpc_timeout"
**Solution**: The RPC endpoint may be slow. Try the command again.

## Next Steps

1. Modify `src/Counter.sol` to your contract
2. Write tests in `test/Counter.t.sol`
3. Run `forge build && forge test`
4. Deploy to testnet and verify on BaseScan
5. Test thoroughly before mainnet deployment

---

**Questions?** Check [Foundry Docs](https://book.getfoundry.sh/) or [Base Docs](https://docs.base.org)
