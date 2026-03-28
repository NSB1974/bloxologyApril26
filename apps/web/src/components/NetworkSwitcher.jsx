
import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useNetwork } from '@/contexts/BaseAuthContext.jsx';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const NetworkSwitcher = () => {
  const { selectedNetwork, networks, setSelectedNetwork } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);

  const CurrentIcon = selectedNetwork?.icon;

  const handleChainSwitch = (network) => {
    setSelectedNetwork(network);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between glass-card hover:glass-card-strong text-[var(--text-primary)] transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              {CurrentIcon && <CurrentIcon className={cn("h-4 w-4", selectedNetwork.color)} />}
              <span>{selectedNetwork?.name || 'Select Network'}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 glass-card-strong border-border/50">
          {Object.values(networks).map((network) => {
            const Icon = network.icon;
            const isActive = network.id === selectedNetwork.id;
            
            return (
              <DropdownMenuItem
                key={network.id}
                onClick={() => handleChainSwitch(network)}
                className="cursor-pointer hover:bg-white/10 transition-colors duration-200"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-5 w-5", network.color)} />
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">{network.name}</div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        Chain ID: {network.id}
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NetworkSwitcher;
