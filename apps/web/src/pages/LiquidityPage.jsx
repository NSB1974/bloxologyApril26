
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Droplets, Plus, Minus, Activity, Percent } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext.jsx';
import { useNetwork } from '@/contexts/BaseAuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { toast } from 'sonner';
import { getTransactionUrl } from '@/utils/etherscanLinks.js';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import TokenSelector from '@/components/TokenSelector.jsx';
import TransactionStatus from '@/components/TransactionStatus.jsx';

const DEFAULT_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000' },
  { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' }
];

const MOCK_POOLS = [
  { id: 'pool-1', pair: 'ETH / USDC', apy: '12.4%', tvl: '$4.2M', feeTier: '0.3%' },
  { id: 'pool-2', pair: 'USDC / USDT', apy: '4.1%', tvl: '$12.8M', feeTier: '0.05%' },
  { id: 'pool-3', pair: 'ETH / USDT', apy: '11.8%', tvl: '$2.1M', feeTier: '0.3%' }
];

const LiquidityPage = () => {
  const { wallet, isConnected } = useWallet();
  const { selectedNetwork, customTokens } = useNetwork();
  
  const [token1, setToken1] = useState(DEFAULT_TOKENS[0].address);
  const [token2, setToken2] = useState(DEFAULT_TOKENS[1].address);
  const [amount1, setAmount1] = useState('');
  const [amount2, setAmount2] = useState('');
  
  const [removePoolId, setRemovePoolId] = useState(MOCK_POOLS[0].id);
  const [removeAmount, setRemoveAmount] = useState('');

  const [txStatus, setTxStatus] = useState('idle');
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);
  const [history, setHistory] = useState([]);

  const allTokens = [...DEFAULT_TOKENS, ...customTokens];

  useEffect(() => {
    const savedHistory = localStorage.getItem('liquidity_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse liquidity history');
      }
    }
  }, []);

  const saveToHistory = (record) => {
    const newHistory = [record, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('liquidity_history', JSON.stringify(newHistory));
  };

  const handleAddLiquidity = async (e) => {
    e.preventDefault();
    if (!isConnected || !wallet) return toast.error('Connect wallet first');
    if (!amount1 || !amount2) return toast.error('Enter amounts for both tokens');
    if (token1 === token2) return toast.error('Select different tokens');

    setTxStatus('pending');
    setTxHash(null);
    setTxError(null);

    try {
      const networkName = selectedNetwork?.name.split(' ')[0].toLowerCase() || 'ethereum';
      
      const response = await apiServerClient.fetch('/liquidity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'add',
          token1,
          token2,
          amount1,
          amount2,
          walletAddress: wallet,
          network: networkName
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to add liquidity');

      setTxStatus('pending'); // Will auto-transition to success in TransactionStatus component
      setTxHash(data.transactionHash);
      
      const t1Symbol = allTokens.find(t => t.address === token1)?.symbol || 'T1';
      const t2Symbol = allTokens.find(t => t.address === token2)?.symbol || 'T2';
      
      saveToHistory({
        id: Date.now(),
        type: 'Add Liquidity',
        details: `Added ${amount1} ${t1Symbol} and ${amount2} ${t2Symbol}`,
        hash: data.transactionHash,
        date: new Date().toISOString(),
        network: selectedNetwork.name
      });

      toast.success('Liquidity transaction submitted!');
      setAmount1('');
      setAmount2('');

    } catch (err) {
      setTxStatus('error');
      setTxError(err.message);
      toast.error(err.message);
    }
  };

  const handleRemoveLiquidity = async (e) => {
    e.preventDefault();
    if (!isConnected || !wallet) return toast.error('Connect wallet first');
    if (!removeAmount) return toast.error('Enter amount to remove');

    setTxStatus('pending');
    setTxHash(null);
    setTxError(null);

    try {
      const networkName = selectedNetwork?.name.split(' ')[0].toLowerCase() || 'ethereum';
      
      const response = await apiServerClient.fetch('/liquidity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'remove',
          poolId: removePoolId,
          amount: removeAmount,
          walletAddress: wallet,
          network: networkName
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to remove liquidity');

      setTxStatus('pending'); // Will auto-transition to success in TransactionStatus component
      setTxHash(data.transactionHash);
      
      const poolName = MOCK_POOLS.find(p => p.id === removePoolId)?.pair || 'Pool';
      
      saveToHistory({
        id: Date.now(),
        type: 'Remove Liquidity',
        details: `Removed ${removeAmount} LP tokens from ${poolName}`,
        hash: data.transactionHash,
        date: new Date().toISOString(),
        network: selectedNetwork.name
      });

      toast.success('Remove liquidity transaction submitted!');
      setRemoveAmount('');

    } catch (err) {
      setTxStatus('error');
      setTxError(err.message);
      toast.error(err.message);
    }
  };

  return (
    <>
      <Helmet>
        <title>Liquidity Pools - Bloxology</title>
        <meta name="description" content="Provide liquidity to earn trading fees and rewards." />
      </Helmet>

      <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-4xl font-bold text-balance mb-2" style={{ letterSpacing: '-0.02em' }}>
              Liquidity Pools
            </h1>
            <p className="text-lg text-[var(--text-secondary)] font-medium">
              Earn yield by providing liquidity on {selectedNetwork?.name || 'multiple networks'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Actions */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="glass-card-strong border-primary/20 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-[var(--text-primary)]">Manage Liquidity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="add" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 bg-black/20 p-1 rounded-xl">
                      <TabsTrigger value="add" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                        <Plus className="h-4 w-4 mr-2" /> Add
                      </TabsTrigger>
                      <TabsTrigger value="remove" className="rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                        <Minus className="h-4 w-4 mr-2" /> Remove
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="add" className="space-y-4 mt-0">
                      <form onSubmit={handleAddLiquidity} className="space-y-4">
                        <div className="space-y-2">
                          <Label>First Token</Label>
                          <div className="flex gap-2">
                            <div className="w-[140px]">
                              <TokenSelector tokens={allTokens} selectedToken={token1} onTokenChange={setToken1} />
                            </div>
                            <Input 
                              type="number" 
                              placeholder="0.0" 
                              value={amount1} 
                              onChange={(e) => setAmount1(e.target.value)}
                              className="input-high-contrast flex-1"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-center py-1">
                          <Plus className="h-5 w-5 text-[var(--text-muted)]" />
                        </div>

                        <div className="space-y-2">
                          <Label>Second Token</Label>
                          <div className="flex gap-2">
                            <div className="w-[140px]">
                              <TokenSelector tokens={allTokens} selectedToken={token2} onTokenChange={setToken2} />
                            </div>
                            <Input 
                              type="number" 
                              placeholder="0.0" 
                              value={amount2} 
                              onChange={(e) => setAmount2(e.target.value)}
                              className="input-high-contrast flex-1"
                            />
                          </div>
                        </div>

                        <TransactionStatus status={txStatus} hash={txHash} network={selectedNetwork} error={txError} />

                        <Button 
                          type="submit" 
                          disabled={txStatus === 'pending' || !isConnected}
                          className="w-full crypto-gradient text-white font-bold h-12 rounded-xl"
                        >
                          {txStatus === 'pending' ? 'Processing...' : 'Add Liquidity'}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="remove" className="space-y-4 mt-0">
                      <form onSubmit={handleRemoveLiquidity} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Select Pool</Label>
                          <select 
                            value={removePoolId}
                            onChange={(e) => setRemovePoolId(e.target.value)}
                            className="w-full h-12 px-3 rounded-xl glass-card input-high-contrast appearance-none"
                          >
                            {MOCK_POOLS.map(p => (
                              <option key={p.id} value={p.id} className="bg-card text-foreground">{p.pair}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Amount (LP Tokens)</Label>
                          <Input 
                            type="number" 
                            placeholder="0.0" 
                            value={removeAmount} 
                            onChange={(e) => setRemoveAmount(e.target.value)}
                            className="input-high-contrast h-12"
                          />
                        </div>

                        <TransactionStatus status={txStatus} hash={txHash} network={selectedNetwork} error={txError} />

                        <Button 
                          type="submit" 
                          disabled={txStatus === 'pending' || !isConnected}
                          variant="destructive"
                          className="w-full font-bold h-12 rounded-xl"
                        >
                          {txStatus === 'pending' ? 'Processing...' : 'Remove Liquidity'}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Pools & History */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Top Pools
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MOCK_POOLS.map((pool, idx) => (
                  <motion.div
                    key={pool.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                  >
                    <Card className="glass-card hover:glass-card-strong transition-all duration-200 border-border/50 h-full">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="font-bold text-lg text-[var(--text-primary)]">{pool.pair}</div>
                          <div className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-md">
                            {pool.feeTier} Fee
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-[var(--text-muted)] mb-1">TVL</p>
                            <p className="font-medium text-[var(--text-primary)]">{pool.tvl}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1">
                              APY <Percent className="h-3 w-3" />
                            </p>
                            <p className="font-bold text-accent">{pool.apy}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Card className="glass-card border-border/50 mt-8">
                <CardHeader>
                  <CardTitle className="text-lg text-[var(--text-primary)]">Your Liquidity History</CardTitle>
                  <CardDescription>Recent add/remove operations</CardDescription>
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-muted)]">
                      <Droplets className="h-8 w-8 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No liquidity history found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 rounded-xl glass-card bg-black/20 border border-border/30 text-sm">
                          <div>
                            <div className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                              {item.type === 'Add Liquidity' ? <Plus className="h-3 w-3 text-accent" /> : <Minus className="h-3 w-3 text-destructive" />}
                              {item.type}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)] mt-1">{item.details}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-[var(--text-muted)]">{new Date(item.date).toLocaleDateString()}</div>
                            <a 
                              href={getTransactionUrl(item.hash, selectedNetwork)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline mt-1 inline-block"
                            >
                              View TX
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default LiquidityPage;
