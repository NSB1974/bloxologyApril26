
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Coins } from 'lucide-react';
import { ethers } from 'ethers';
import { useNetwork } from '@/contexts/BaseAuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)'
];

const CustomTokenManager = () => {
  const { selectedNetwork, customTokens, addCustomToken, removeCustomToken } = useNetwork();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    address: '',
    name: '',
    symbol: '',
    decimals: ''
  });

  const currentNetworkTokens = customTokens.filter(t => t.chainId === selectedNetwork.id);

  useEffect(() => {
    console.log('[CustomTokenManager] Mounted. Current network tokens:', currentNetworkTokens);
  }, [customTokens, selectedNetwork.id]);

  const handleAddressChange = async (e) => {
    const address = e.target.value;
    setFormData(prev => ({ ...prev, address }));

    if (ethers.isAddress(address)) {
      console.log(`[CustomTokenManager] Valid address detected: ${address}. Fetching details...`);
      setLoading(true);
      try {
        const provider = new ethers.JsonRpcProvider(selectedNetwork.rpcUrl);
        const contract = new ethers.Contract(address, ERC20_ABI, provider);
        
        const [name, symbol, decimals] = await Promise.all([
          contract.name().catch(() => ''),
          contract.symbol().catch(() => ''),
          contract.decimals().catch(() => 18)
        ]);

        console.log(`[CustomTokenManager] Fetched token details:`, { name, symbol, decimals });

        setFormData(prev => ({
          ...prev,
          name: name || prev.name,
          symbol: symbol || prev.symbol,
          decimals: decimals.toString()
        }));
      } catch (error) {
        console.error('[CustomTokenManager] Failed to fetch token details:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('[CustomTokenManager] Form submitted with data:', formData);
    
    if (!ethers.isAddress(formData.address)) {
      toast({ variant: "destructive", title: "Invalid Address", description: "Please enter a valid token contract address." });
      return;
    }

    if (!formData.symbol || !formData.decimals) {
      toast({ variant: "destructive", title: "Missing Info", description: "Symbol and decimals are required." });
      return;
    }

    const newToken = {
      address: formData.address,
      name: formData.name || formData.symbol,
      symbol: formData.symbol,
      decimals: parseInt(formData.decimals),
      chainId: selectedNetwork.id
    };

    console.log('[CustomTokenManager] Validation passed. Adding token:', newToken);
    addCustomToken(newToken);

    toast({ title: "Token Added", description: `${formData.symbol} has been added to ${selectedNetwork.name}.` });
    setIsOpen(false);
    setFormData({ address: '', name: '', symbol: '', decimals: '' });
  };

  const handleDelete = (address) => {
    if (window.confirm('Remove this custom token?')) {
      console.log(`[CustomTokenManager] Removing token with address: ${address}`);
      removeCustomToken(address, selectedNetwork.id);
      toast({ title: "Token Removed", description: "The custom token has been removed." });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Custom Tokens ({selectedNetwork.name})</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Token
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-[var(--text-primary)]">Add Custom Token</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="address">Token Contract Address *</Label>
                <div className="relative">
                  <Input 
                    id="address" 
                    value={formData.address} 
                    onChange={handleAddressChange} 
                    placeholder="0x..." 
                    className="input-high-contrast pr-10"
                    required 
                  />
                  {loading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-[var(--text-muted)]" />}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbol">Token Symbol *</Label>
                <Input 
                  id="symbol" 
                  value={formData.symbol} 
                  onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))} 
                  placeholder="e.g. UNI" 
                  className="input-high-contrast"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Token Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                    placeholder="e.g. Uniswap" 
                    className="input-high-contrast"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="decimals">Decimals *</Label>
                  <Input 
                    id="decimals" 
                    type="number" 
                    value={formData.decimals} 
                    onChange={(e) => setFormData(prev => ({ ...prev, decimals: e.target.value }))} 
                    placeholder="18" 
                    className="input-high-contrast"
                    required 
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Save Token
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {currentNetworkTokens.length === 0 ? (
        <div className="text-center py-8 glass-card rounded-xl border-dashed border-2 border-border/50">
          <Coins className="h-8 w-8 mx-auto text-[var(--text-muted)] mb-2" />
          <p className="text-[var(--text-secondary)] font-medium">No custom tokens on this network.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {currentNetworkTokens.map(token => (
            <Card key={token.address} className="glass-card border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[var(--text-primary)]">{token.symbol}</div>
                  <div className="text-xs text-[var(--text-muted)] font-mono truncate max-w-[200px] sm:max-w-xs">
                    {token.address}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDelete(token.address)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomTokenManager;
