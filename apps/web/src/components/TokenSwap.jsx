
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownUp, Loader2, CheckCircle, AlertCircle, Settings, Info } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient.js';
import { useBaseAuth, useNetwork } from '@/contexts/BaseAuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FeeDisplay from '@/components/FeeDisplay.jsx';
import { getTransactionUrl } from '@/utils/etherscanLinks.js';
import { calculateSwapFee, FEE_RECIPIENT, FEE_CONFIG } from '@/utils/feeCalculator.js';

const DEFAULT_TOKENS_BY_CHAIN = {
  8453: [
    { symbol: 'ETH', address: '0x4200000000000000000000000000000000000006' },
    { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
    { symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' },
    { symbol: 'USDT', address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' }
  ],
  1: [
    { symbol: 'ETH', address: '0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2' },
    { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' }
  ]
};

const getDefaultTokensForChain = (chainId) => {
  return DEFAULT_TOKENS_BY_CHAIN[Number(chainId)] || DEFAULT_TOKENS_BY_CHAIN[8453];
};

const TokenSwap = () => {
  const { activeAddress } = useBaseAuth();
  const { selectedNetwork, customTokens } = useNetwork();
  const defaultTokens = getDefaultTokensForChain(selectedNetwork.id);
  const [fromToken, setFromToken] = useState(defaultTokens[0].address);
  const [toToken, setToToken] = useState(defaultTokens[1].address);
  const [amount, setAmount] = useState('');
  
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // Combine default tokens with custom tokens for current network
  const customTokensForNetwork = customTokens.filter(
    (t) => Number(t.chainId) === Number(selectedNetwork.id)
  );
  const availableTokens = [...defaultTokens, ...customTokensForNetwork].filter(
    (token, index, arr) =>
      arr.findIndex((item) => item.address.toLowerCase() === token.address.toLowerCase()) === index
  );

  // Reset state when active address or network changes
  useEffect(() => {
    setResult(null);
    setError(null);
    // Reset to default tokens if custom tokens were removed
    if (!availableTokens.find(t => t.address.toLowerCase() === fromToken.toLowerCase())) {
      setFromToken(defaultTokens[0].address);
    }
    if (!availableTokens.find(t => t.address.toLowerCase() === toToken.toLowerCase())) {
      setToToken(defaultTokens[1].address);
    }
  }, [activeAddress, selectedNetwork.id, customTokens]);

  // Debounced quote fetching
  useEffect(() => {
    const fetchQuote = async () => {
      if (!amount || parseFloat(amount) <= 0 || fromToken === toToken) {
        setQuote(null);
        return;
      }

      setLoadingQuote(true);
      setError(null);

      try {
        const response = await apiServerClient.fetch('/base/token-swap-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromAddress: activeAddress,
            fromToken,
            toToken,
            amount,
            chainId: selectedNetwork.id
          })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch quote');
        }

        setQuote(result.data);
      } catch (err) {
        setError(err.message);
        setQuote(null);
      } finally {
        setLoadingQuote(false);
      }
    };

    const timeoutId = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [fromToken, toToken, amount, selectedNetwork.id, activeAddress]);

  const handleSwapDirection = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
    setQuote(null);
  };

  const executeSwap = async (e) => {
    e.preventDefault();
    if (!quote || !activeAddress) return;

    setIsSwapping(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error('Wallet provider not found. Please connect a wallet extension.');
      }

      if (!quote.execution) {
        throw new Error('Live execution data unavailable for this quote. Try another token pair or reconnect wallet.');
      }

      let txHash = null;

      if (quote.execution.type === 'transaction' && quote.execution.transaction) {
        const txRequest = {
          from: activeAddress,
          ...quote.execution.transaction,
        };
        txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [txRequest],
        });
      } else if (quote.execution.type === 'calls' && Array.isArray(quote.execution.calls)) {
        txHash = await window.ethereum.request({
          method: 'wallet_sendCalls',
          params: [
            {
              version: '1.0',
              chainId: `0x${Number(selectedNetwork.id).toString(16)}`,
              from: activeAddress,
              calls: quote.execution.calls,
            },
          ],
        });
      }

      if (!txHash) {
        throw new Error('Wallet did not return a transaction hash.');
      }

      const feeAmount = Number(quote.feeAmount ?? calculateSwapFee(quote.outputAmount));
      const netOutput = Number(quote.netOutputAmount ?? (parseFloat(quote.outputAmount) - feeAmount));

      setIsSwapping(false);
      setResult({
        message: `Swap submitted on ${selectedNetwork.name}`,
        transactionHash: txHash,
        amountIn: amount,
        grossOut: quote.outputAmount,
        feePaid: feeAmount,
        netOut: netOutput,
        toSymbol: availableTokens.find(t => t.address.toLowerCase() === toToken.toLowerCase())?.symbol || 'Tokens',
        swappedBy: activeAddress
      });
      setAmount('');
      setQuote(null);
    } catch (err) {
      setError(err.message || 'Swap execution failed');
      setIsSwapping(false);
    }
  };

  const toTokenSymbol = availableTokens.find(t => t.address.toLowerCase() === toToken.toLowerCase())?.symbol || '';
  const feeAmount = quote ? Number(quote.feeAmount ?? calculateSwapFee(quote.outputAmount)) : 0;
  const netOutput = quote ? Number(quote.netOutputAmount ?? (parseFloat(quote.outputAmount) - feeAmount)) : 0;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="glass-card-strong border-border/50 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl text-[var(--text-primary)]">Swap on {selectedNetwork.name}</CardTitle>
          <Button variant="ghost" size="icon" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <Settings className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={executeSwap} className="space-y-2">
            {/* From Token */}
            <div className="glass-card p-4 rounded-2xl space-y-3 border border-border/30">
              <Label className="text-xs text-[var(--text-secondary)]">You pay</Label>
              <div className="flex gap-3">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-3xl font-bold bg-transparent border-none shadow-none px-0 focus-visible:ring-0 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
                <Select value={fromToken} onValueChange={setFromToken}>
                  <SelectTrigger className="w-[120px] rounded-xl bg-primary/10 border-primary/20 text-[var(--text-primary)] font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card-strong">
                    {availableTokens.map((token) => (
                      <SelectItem key={token.address} value={token.address} className="font-bold">
                        {token.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center -my-4 relative z-10">
              <Button
                type="button"
                onClick={handleSwapDirection}
                variant="outline"
                size="icon"
                className="rounded-xl glass-card-strong border-border/50 text-[var(--text-primary)] hover:text-primary hover:border-primary/50 transition-all duration-200 h-10 w-10"
              >
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </div>

            {/* To Token */}
            <div className="glass-card p-4 rounded-2xl space-y-3 border border-border/30">
              <Label className="text-xs text-[var(--text-secondary)]">You receive (Gross)</Label>
              <div className="flex gap-3">
                <div className="flex-1 flex items-center">
                  {loadingQuote ? (
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
                  ) : (
                    <span className="text-3xl font-bold text-[var(--text-primary)]">
                      {quote ? parseFloat(quote.outputAmount).toLocaleString(undefined, { maximumFractionDigits: 9 }) : '0.0'}
                    </span>
                  )}
                </div>
                <Select value={toToken} onValueChange={setToToken}>
                  <SelectTrigger className="w-[120px] rounded-xl bg-primary/10 border-primary/20 text-[var(--text-primary)] font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card-strong">
                    {availableTokens.map((token) => (
                      <SelectItem key={token.address} value={token.address} className="font-bold">
                        {token.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="glass-card border-destructive/50 mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}

            {/* Quote Details & Fee Display */}
            {quote && !loadingQuote && !error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-4 space-y-4"
              >
                <div className="space-y-2 px-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)] font-medium">Exchange Rate</span>
                    <span className="text-[var(--text-primary)] font-medium">1 = {quote.exchangeRate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)] font-medium">Network Fee</span>
                    <span className="text-[var(--text-primary)] font-medium">{quote.gasFee} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)] font-medium">Price Impact</span>
                    <span className={`font-medium ${quote.slippage > 1 ? 'text-destructive' : 'text-accent'}`}>
                      {quote.slippage}%
                    </span>
                  </div>
                  {(quote?.pricing?.fromTokenSource === 'coingecko-contract' || quote?.pricing?.toTokenSource === 'coingecko-contract') && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                      <p className="text-xs font-semibold text-amber-300">Estimated pricing is being used for one or both tokens.</p>
                    </div>
                  )}
                  {quote?.provider === 'alchemy' && (
                    <div className="rounded-lg border border-accent/20 bg-accent/10 px-3 py-2">
                      <p className="text-xs font-semibold text-accent">Live executable quote from Alchemy.</p>
                    </div>
                  )}
                  {quote?.provider === 'alchemy' && quote?.execution && quote?.feeRecipient && (
                    <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2">
                      <p className="text-xs font-semibold text-primary">0.4% fee enforced on-chain and routed to {quote.feeRecipient}.</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-white/5 px-3 py-2">
                    <Info className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                    <p className="text-[11px] font-medium text-[var(--text-secondary)]">
                      Quote quality: mapped market pairs are live-priced, other contracts use estimated market lookup.
                    </p>
                    <Dialog open={isPricingModalOpen} onOpenChange={setIsPricingModalOpen}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="ml-auto rounded border border-border/40 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)] transition-colors hover:border-primary/40 hover:text-[var(--text-primary)]"
                        >
                          Details
                        </button>
                      </DialogTrigger>
                      <DialogContent className="glass-card-strong border-border/50 sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-[var(--text-primary)]">Quote Pricing Details</DialogTitle>
                          <DialogDescription className="text-[var(--text-secondary)]">
                            Swap quotes combine token market prices and estimated execution assumptions.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 text-sm">
                          <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
                            <p className="font-semibold text-[var(--text-primary)]">Mapped market source</p>
                            <p className="text-[var(--text-secondary)]">Direct market mapping for known tokens, typically highest-confidence quotes.</p>
                          </div>
                          <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3">
                            <p className="font-semibold text-amber-300">Estimated market source</p>
                            <p className="text-[var(--text-secondary)]">Resolved by token contract lookup and may differ from executable DEX output at trade time.</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <FeeDisplay 
                  title="Swap Output Breakdown"
                  feeAmount={feeAmount}
                  feePercent={FEE_CONFIG.SWAP_FEE_PERCENT}
                  totalAmount={quote.outputAmount}
                  netAmount={netOutput}
                  feeRecipient={quote?.feeRecipient || FEE_RECIPIENT}
                  symbol={toTokenSymbol}
                />
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={!quote || !quote.execution || isSwapping || loadingQuote || fromToken === toToken || !activeAddress}
              className="w-full h-14 mt-4 text-lg font-bold crypto-gradient text-white rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg shadow-primary/20"
            >
              {isSwapping ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Confirming Swap...
                </>
              ) : !activeAddress ? (
                'Connect Wallet'
              ) : fromToken === toToken ? (
                'Select different tokens'
              ) : !amount ? (
                'Enter an amount'
              ) : !quote?.execution ? (
                'No executable route'
              ) : (
                'Swap'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="glass-card border-accent/50 bg-accent/5">
            <CheckCircle className="h-5 w-5 text-accent" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-bold text-[var(--text-primary)]">{result.message}</p>
                <div className="text-sm space-y-1 text-[var(--text-secondary)] font-medium">
                  <p className="font-mono break-all">
                    <span className="text-[var(--text-primary)]">TX:</span> {result.transactionHash}
                  </p>
                  <p>
                    <a
                      href={getTransactionUrl(result.transactionHash, selectedNetwork)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-primary hover:underline"
                    >
                      View on explorer
                    </a>
                  </p>
                  <p className="font-mono break-all">
                    <span className="text-[var(--text-primary)]">By:</span> {result.swappedBy}
                  </p>
                  <p>Swapped {result.amountIn} for {parseFloat(result.grossOut).toLocaleString(undefined, { maximumFractionDigits: 9 })} {result.toSymbol}</p>
                  <p className="text-destructive/90">Fee paid: {parseFloat(result.feePaid).toLocaleString(undefined, { maximumFractionDigits: 9 })} {result.toSymbol}</p>
                  <p className="text-accent font-bold">Net received: {parseFloat(result.netOut).toLocaleString(undefined, { maximumFractionDigits: 9 })} {result.toSymbol}</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </div>
  );
};

export default TokenSwap;
