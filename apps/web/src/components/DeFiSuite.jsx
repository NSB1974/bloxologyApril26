
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ArrowDownUp, Droplets, Lock, LineChart } from 'lucide-react';
import { useBaseAuth } from '@/contexts/BaseAuthContext.jsx';
import TokenBalanceChecker from '@/components/TokenBalanceChecker.jsx';
import TokenSwap from '@/components/TokenSwap.jsx';
import LiquidityPool from '@/components/LiquidityPool.jsx';
import TokenLocker from '@/components/TokenLocker.jsx';
import PriceChart from '@/components/PriceChart.jsx';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'portfolio', label: 'Portfolio', icon: Wallet, component: TokenBalanceChecker },
  { id: 'swap', label: 'Swap', icon: ArrowDownUp, component: TokenSwap },
  { id: 'liquidity', label: 'Pools', icon: Droplets, component: LiquidityPool },
  { id: 'locker', label: 'Locker', icon: Lock, component: TokenLocker },
  { id: 'charts', label: 'Charts', icon: LineChart, component: PriceChart }
];

const DeFiSuite = () => {
  const [activeTab, setActiveTab] = useState('portfolio');
  // We extract activeAddress here to ensure the suite re-renders if it changes,
  // though child components also use the hook directly.
  const { activeAddress } = useBaseAuth();

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || TokenBalanceChecker;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto custom-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex space-x-2 glass-card p-1.5 rounded-2xl min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200",
                  isActive 
                    ? "text-white shadow-md" 
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeDeFiTab"
                    className="absolute inset-0 crypto-gradient rounded-xl"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${activeAddress}`} // Force re-animation when address changes
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DeFiSuite;
