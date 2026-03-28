
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Bug, Play, RefreshCw, CheckCircle2, XCircle, Database } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext.jsx';
import { useNetwork } from '@/contexts/BaseAuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const DebugTokensPage = () => {
  const { wallet, isConnected, jwtToken } = useWallet();
  const { selectedNetwork } = useNetwork();
  
  const [testAddress, setTestAddress] = useState(wallet || '');
  const [testNetwork, setTestNetwork] = useState(selectedNetwork?.id?.toString() || '1');
  
  const [loading, setLoading] = useState(false);
  const [rawResponse, setRawResponse] = useState(null);
  const [parsedTokens, setParsedTokens] = useState(null);
  const [error, setError] = useState(null);

  const handleTestSample = () => {
    // Vitalik's address as a reliable sample with tokens
    setTestAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    setTestNetwork('1'); // Ethereum Mainnet
  };

  const runTest = async () => {
    if (!testAddress) {
      setError('Please enter a wallet address to test');
      return;
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/i.test(testAddress)) {
      setError('Invalid wallet address format. Must be a valid Ethereum address.');
      return;
    }

    if (!testNetwork) {
      setError('Please select a network (Chain ID)');
      return;
    }

    setLoading(true);
    setError(null);
    setRawResponse(null);
    setParsedTokens(null);

    try {
      const chainId = String(testNetwork);
      // apiServerClient automatically prepends /hcgi/api to this endpoint
      const endpoint = `/balance?address=${testAddress}&chainId=${chainId}`;
      
      console.log(`[DebugTokensPage] Initiating API Call...`);
      console.log(`[DebugTokensPage] Exact URL being requested: /hcgi/api${endpoint}`);
      console.log(`[DebugTokensPage] Request Parameters: { address: '${testAddress}', chainId: '${chainId}' }`);
      
      const response = await apiServerClient.fetch(endpoint, {
        headers: jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {}
      });
      
      console.log(`[DebugTokensPage] Response Status:`, response.status);

      const data = await response.json();
      console.log(`[DebugTokensPage] Full API Response Data:`, data);
      
      setRawResponse(data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP Error ${response.status}: Failed to fetch balances`);
      }

      // Handle both { success: true, data: [...] } and [...] formats
      const parsedData = data.success && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setParsedTokens(parsedData);
      
    } catch (err) {
      console.error('[DebugTokensPage] API Error Encountered:', err.message);
      console.error('[DebugTokensPage] Full Error Details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Debug Tokens - Bloxology</title>
      </Helmet>

      <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <Bug className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold text-balance" style={{ letterSpacing: '-0.02em' }}>
                Token Fetching Debugger
              </h1>
            </div>
            <p className="text-[var(--text-secondary)] font-medium">
              Diagnostic tool to verify the token fetching pipeline and API responses.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Context State Panel */}
            <Card className="glass-card border-border/50 lg:col-span-1 h-fit">
              <CardHeader className="pb-4 border-b border-border/30 bg-black/10">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Current Context State
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <Label className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Connection Status</Label>
                  <div className="flex items-center gap-2 mt-1 font-medium">
                    {isConnected ? (
                      <><CheckCircle2 className="h-4 w-4 text-green-500" /> Connected</>
                    ) : (
                      <><XCircle className="h-4 w-4 text-destructive" /> Disconnected</>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Wallet Address</Label>
                  <div className="mt-1 font-mono text-sm text-[var(--text-primary)] break-all bg-black/20 p-2 rounded border border-border/30">
                    {wallet || 'null'}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Selected Network</Label>
                  <div className="mt-1 text-sm text-[var(--text-primary)] bg-black/20 p-2 rounded border border-border/30">
                    {selectedNetwork ? (
                      <div>
                        <div className="font-bold">{selectedNetwork.name}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-1">Chain ID: {selectedNetwork.id}</div>
                        <div className="text-xs text-[var(--text-secondary)]">RPC: {selectedNetwork.rpcUrl}</div>
                      </div>
                    ) : 'null'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manual Test Panel */}
            <Card className="glass-card-strong border-primary/20 lg:col-span-2">
              <CardHeader className="pb-4 border-b border-border/30 bg-black/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  Manual API Test
                </CardTitle>
                <CardDescription>
                  Directly call the /balance endpoint to verify backend functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-address">Wallet Address</Label>
                    <Input 
                      id="test-address"
                      value={testAddress}
                      onChange={(e) => setTestAddress(e.target.value)}
                      placeholder="0x..."
                      className="font-mono bg-black/20 text-[var(--text-primary)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-network">Network Identifier (Chain ID)</Label>
                    <Select value={testNetwork} onValueChange={setTestNetwork}>
                      <SelectTrigger className="bg-black/20 text-[var(--text-primary)]">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Ethereum (1)</SelectItem>
                        <SelectItem value="137">Polygon (137)</SelectItem>
                        <SelectItem value="42161">Arbitrum (42161)</SelectItem>
                        <SelectItem value="10">Optimism (10)</SelectItem>
                        <SelectItem value="8453">Base (8453)</SelectItem>
                        <SelectItem value="2222">Kava (2222)</SelectItem>
                        <SelectItem value="11155111">Sepolia (11155111)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={runTest} disabled={loading} className="bg-primary text-primary-foreground">
                    {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                    Execute Request
                  </Button>
                  <Button onClick={handleTestSample} variant="outline" className="glass-card">
                    Use Sample Address (vitalik.eth)
                  </Button>
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>API Error</AlertTitle>
                    <AlertDescription className="font-mono text-xs mt-1">{error}</AlertDescription>
                  </Alert>
                )}

                {rawResponse && (
                  <div className="space-y-4 mt-6">
                    <div>
                      <Label className="text-sm font-bold text-[var(--text-primary)] mb-2 block">Raw JSON Response</Label>
                      <pre className="bg-black/40 p-4 rounded-lg border border-border/30 overflow-x-auto text-xs font-mono text-[var(--text-secondary)] max-h-64 custom-scrollbar">
                        {JSON.stringify(rawResponse, null, 2)}
                      </pre>
                    </div>

                    {parsedTokens && (
                      <div>
                        <Label className="text-sm font-bold text-[var(--text-primary)] mb-2 block">Parsed Token Data ({parsedTokens.length} items)</Label>
                        <div className="bg-black/20 rounded-lg border border-border/30 overflow-hidden">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-black/40 text-[var(--text-muted)] uppercase text-xs">
                              <tr>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Symbol</th>
                                <th className="px-4 py-3">Balance</th>
                                <th className="px-4 py-3">Decimals</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                              {parsedTokens.length === 0 ? (
                                <tr>
                                  <td colSpan="4" className="px-4 py-4 text-center text-[var(--text-muted)]">No tokens found</td>
                                </tr>
                              ) : (
                                parsedTokens.map((token, i) => (
                                  <tr key={i} className="hover:bg-white/5">
                                    <td className="px-4 py-3 font-medium">
                                      <span className={`px-2 py-1 rounded text-xs ${token.type === 'native' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-[var(--text-secondary)]'}`}>
                                        {token.type || 'token'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{token.symbol}</td>
                                    <td className="px-4 py-3 font-mono">{token.balance}</td>
                                    <td className="px-4 py-3 text-[var(--text-muted)]">{token.decimals}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </>
  );
};

export default DebugTokensPage;
