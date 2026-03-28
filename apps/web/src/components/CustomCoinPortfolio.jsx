
import React, { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import CustomTokenManager from './CustomTokenManager.jsx';
import TokenBalanceChecker from './TokenBalanceChecker.jsx';

const CustomCoinPortfolio = ({ selectedNetwork }) => {
  
  useEffect(() => {
    console.log('[CustomCoinPortfolio] Rendered with network:', selectedNetwork?.name);
  }, [selectedNetwork]);

  if (!selectedNetwork) {
    return (
      <div className="p-8 text-center text-[var(--text-secondary)] glass-card rounded-xl">
        Loading network...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Portfolio</h2>
          <p className="text-[var(--text-secondary)] font-medium">Track your assets on {selectedNetwork.name}</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Manage Tokens
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <CustomTokenManager />
          </DialogContent>
        </Dialog>
      </div>

      {/* Passing selectedNetwork down to TokenBalanceChecker */}
      <TokenBalanceChecker selectedNetwork={selectedNetwork} />
    </div>
  );
};

export default CustomCoinPortfolio;
