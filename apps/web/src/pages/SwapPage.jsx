import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNetwork } from '@/contexts/BaseAuthContext.jsx';
import TokenSwap from '@/components/TokenSwap.jsx';

const SwapPage = () => {
  const { selectedNetwork } = useNetwork();

  return (
    <>
      <Helmet>
        <title>Swap Tokens - Bloxology</title>
        <meta name="description" content="Swap tokens instantly with low fees and minimal slippage." />
      </Helmet>

      <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-4xl font-bold text-balance mb-2" style={{ letterSpacing: '-0.02em' }}>
                Swap Tokens
              </h1>
              <p className="text-lg text-[var(--text-secondary)] font-medium mb-8">
                Trade instantly across {selectedNetwork?.name || 'multiple networks'}
              </p>

              <TokenSwap />
            </motion.div>
          </div>

          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="glass-card p-6 rounded-2xl border border-border/30">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Swap Details</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Swaps use live quote APIs and show fee breakdown before confirmation.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SwapPage;
