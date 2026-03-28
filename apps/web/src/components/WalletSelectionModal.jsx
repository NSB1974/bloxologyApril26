
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Wallet } from 'lucide-react';

const WalletSelectionModal = ({ isOpen, onSelectWallet, onClose }) => {
  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect using your browser extension',
      icon: (
        <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M29.4 11.4L22.5 2.5L16 7.2L9.5 2.5L2.6 11.4L4.8 21.8L1.5 28.5L10.2 26.8L16 30.5L21.8 26.8L30.5 28.5L27.2 21.8L29.4 11.4Z" fill="#E2761B"/>
          <path d="M16 7.2L22.5 2.5L29.4 11.4L27.2 21.8L21.8 26.8L16 30.5L10.2 26.8L4.8 21.8L2.6 11.4L9.5 2.5L16 7.2Z" fill="#E4761B"/>
          <path d="M27.2 21.8L30.5 28.5L21.8 26.8L27.2 21.8Z" fill="#E4761B"/>
          <path d="M4.8 21.8L1.5 28.5L10.2 26.8L4.8 21.8Z" fill="#E4761B"/>
          <path d="M16 30.5L21.8 26.8L16 22.5L10.2 26.8L16 30.5Z" fill="#D7C1B3"/>
          <path d="M16 22.5L21.8 26.8L27.2 21.8L22.5 16.5L16 19.5L9.5 16.5L4.8 21.8L10.2 26.8L16 22.5Z" fill="#233447"/>
          <path d="M16 19.5L22.5 16.5L16 7.2L9.5 16.5L16 19.5Z" fill="#CC6200"/>
        </svg>
      )
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Connect using Coinbase Wallet app',
      icon: (
        <div className="w-8 h-8 bg-[#0052FF] rounded-full flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white rounded-full" />
        </div>
      )
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md glass-card-strong border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Connect Wallet
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
            Select a wallet provider to connect to Bloxology.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => onSelectWallet(wallet.id)}
              className="flex items-center gap-4 p-4 rounded-xl glass-card border border-border/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group text-left"
            >
              <div className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                {wallet.icon}
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">{wallet.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{wallet.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletSelectionModal;
