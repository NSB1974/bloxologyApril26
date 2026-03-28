
import React, { useState } from 'react';
import { ChevronDown, Check, Plus, Network } from 'lucide-react';
import { useNetwork } from '@/contexts/BaseAuthContext.jsx';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import CustomNetworkManager from './CustomNetworkManager.jsx';
import { cn } from '@/lib/utils';

const NetworkSelector = ({ selectedNetwork, onNetworkChange, disabled }) => {
  const { networks } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const handleSelect = (network) => {
    if (onNetworkChange) {
      onNetworkChange(network);
    }
    setIsOpen(false);
  };

  const defaultNetworks = Object.values(networks).filter(n => !n.isCustom);
  const customNetworks = Object.values(networks).filter(n => n.isCustom);

  const CurrentIcon = selectedNetwork?.icon || Network;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="w-[240px] justify-between glass-card hover:glass-card-strong text-[var(--text-primary)] transition-all duration-200"
          >
            <div className="flex items-center gap-2 truncate">
              <CurrentIcon className={cn("h-4 w-4 flex-shrink-0", selectedNetwork?.color || "text-primary")} />
              <span className="truncate">{selectedNetwork?.name || 'Select Network'}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[240px] glass-card-strong border-border/50 z-50">
          <DropdownMenuLabel className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
            Default Networks
          </DropdownMenuLabel>
          {defaultNetworks.map((network) => {
            const Icon = network.icon;
            const isActive = network.id === selectedNetwork?.id;
            
            return (
              <DropdownMenuItem
                key={network.id}
                onClick={() => handleSelect(network)}
                className="cursor-pointer hover:bg-white/10 transition-colors duration-200"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-4 w-4", network.color)} />
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">{network.name}</div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        Chain ID: {network.id}
                      </div>
                    </div>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-primary" />}
                </div>
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator className="bg-border/50" />
          
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Custom Networks
            </span>
            <Dialog open={isManagerOpen} onOpenChange={setIsManagerOpen}>
              <DialogTrigger asChild>
                <button 
                  className="text-[10px] font-medium text-primary hover:underline flex items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="h-3 w-3 mr-0.5" /> Manage
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-card border-border z-[60]">
                <CustomNetworkManager />
              </DialogContent>
            </Dialog>
          </div>

          {customNetworks.length > 0 ? (
            customNetworks.map((network) => {
              const Icon = network.icon || Network;
              const isActive = network.id === selectedNetwork?.id;
              
              return (
                <DropdownMenuItem
                  key={network.id}
                  onClick={() => handleSelect(network)}
                  className="cursor-pointer hover:bg-white/10 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-4 w-4", network.color || "text-primary")} />
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">{network.name}</div>
                        <div className="text-[10px] text-[var(--text-secondary)]">
                          Chain ID: {network.id}
                        </div>
                      </div>
                    </div>
                    {isActive && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </DropdownMenuItem>
              );
            })
          ) : (
            <div className="px-2 py-3 text-xs text-[var(--text-muted)] italic text-center">
              No custom networks added
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NetworkSelector;
