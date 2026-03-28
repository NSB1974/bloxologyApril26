
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle2, Loader2, Network } from 'lucide-react';
import { useNetwork } from '@/contexts/BaseAuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const CustomNetworkManager = () => {
  const { networks, addCustomNetwork, removeCustomNetwork } = useNetwork();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    rpcUrl: '',
    id: '',
    currencySymbol: 'ETH',
    blockExplorer: ''
  });

  const customNetworks = Object.values(networks).filter(n => n.isCustom);

  useEffect(() => {
    console.log('[CustomNetworkManager] Mounted. Current custom networks:', customNetworks);
  }, [customNetworks]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateRpc = async (url) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 })
      });
      const data = await response.json();
      return data.result ? parseInt(data.result, 16) : null;
    } catch (error) {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[CustomNetworkManager] Form submitted with data:', formData);
    setLoading(true);

    try {
      if (!formData.name || !formData.rpcUrl || !formData.id) {
        throw new Error('Please fill in all required fields');
      }

      const chainId = parseInt(formData.id);
      if (isNaN(chainId)) {
        throw new Error('Chain ID must be a number');
      }

      if (networks[chainId] && !networks[chainId].isCustom) {
        throw new Error('This Chain ID is already used by a default network');
      }

      const actualChainId = await validateRpc(formData.rpcUrl);
      if (!actualChainId) {
        throw new Error('Could not connect to RPC URL');
      }
      if (actualChainId !== chainId) {
        throw new Error(`RPC returned Chain ID ${actualChainId}, but you entered ${chainId}`);
      }

      const newNetwork = {
        id: chainId,
        name: formData.name,
        rpcUrl: formData.rpcUrl,
        blockExplorer: formData.blockExplorer,
        currencySymbol: formData.currencySymbol,
        isTestnet: false
      };

      console.log('[CustomNetworkManager] Validation passed. Adding network:', newNetwork);
      addCustomNetwork(newNetwork);

      toast({
        title: "Network Added",
        description: `${formData.name} has been added successfully.`
      });
      
      setIsOpen(false);
      setFormData({ name: '', rpcUrl: '', id: '', currencySymbol: 'ETH', blockExplorer: '' });
    } catch (error) {
      console.error('[CustomNetworkManager] Form validation error:', error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this custom network?')) {
      console.log(`[CustomNetworkManager] Removing network with ID: ${id}`);
      removeCustomNetwork(id);
      toast({
        title: "Network Removed",
        description: "The custom network has been removed."
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Custom Networks</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Network
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-[var(--text-primary)]">Add Custom Network</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Network Name *</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  placeholder="e.g. Arbitrum One" 
                  className="input-high-contrast"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rpcUrl">RPC URL *</Label>
                <Input 
                  id="rpcUrl" 
                  name="rpcUrl" 
                  value={formData.rpcUrl} 
                  onChange={handleInputChange} 
                  placeholder="https://arb1.arbitrum.io/rpc" 
                  className="input-high-contrast"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id">Chain ID *</Label>
                  <Input 
                    id="id" 
                    name="id" 
                    type="number" 
                    value={formData.id} 
                    onChange={handleInputChange} 
                    placeholder="42161" 
                    className="input-high-contrast"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencySymbol">Currency Symbol</Label>
                  <Input 
                    id="currencySymbol" 
                    name="currencySymbol" 
                    value={formData.currencySymbol} 
                    onChange={handleInputChange} 
                    placeholder="ETH" 
                    className="input-high-contrast"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="blockExplorer">Block Explorer URL</Label>
                <Input 
                  id="blockExplorer" 
                  name="blockExplorer" 
                  value={formData.blockExplorer} 
                  onChange={handleInputChange} 
                  placeholder="https://arbiscan.io" 
                  className="input-high-contrast"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Save Network
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {customNetworks.length === 0 ? (
        <div className="text-center py-8 glass-card rounded-xl border-dashed border-2 border-border/50">
          <Network className="h-8 w-8 mx-auto text-[var(--text-muted)] mb-2" />
          <p className="text-[var(--text-secondary)] font-medium">No custom networks added yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {customNetworks.map(network => (
            <Card key={network.id} className="glass-card border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[var(--text-primary)]">{network.name}</div>
                  <div className="text-xs text-[var(--text-muted)] font-mono">Chain ID: {network.id}</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDelete(network.id)}
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

export default CustomNetworkManager;
