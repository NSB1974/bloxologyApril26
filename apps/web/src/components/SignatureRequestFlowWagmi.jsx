import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useSignMessage, useAccount } from 'wagmi';
import { createSiweMessage, generateSiweNonce } from 'viem/siwe';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SignatureRequestFlow = ({ address, onSignatureSuccess, onCancel }) => {
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const { chainId } = useAccount();
  const [step, setStep] = useState('preparing');
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const prepareMessage = async () => {
      try {
        setStep('preparing');
        setError(null);
        
        const currentNonce = generateSiweNonce();
        setNonce(currentNonce);
        
        const issuedAt = new Date();
        const siweMessage = createSiweMessage({
          address: address,
          chainId: chainId || 1,
          domain: window.location.host,
          nonce: currentNonce,
          uri: window.location.origin,
          version: '1',
          issuedAt,
          statement: 'Sign in to Bloxology.'
        });
        
        setMessage(siweMessage);
        setStep('signing');

      } catch (err) {
        console.error('Preparation error:', err);
        setError(err.message || 'Failed to prepare message');
      }
    };

    prepareMessage();
  }, [address, chainId]);

  const handleSign = async () => {
    if (!message) return;
    
    try {
      setStep('verifying');
      setError(null);
      
      const signature = await signMessageAsync({ message });
      
      onSignatureSuccess({
        address,
        signature,
        message,
        nonce,
        chainId: chainId || 1,
        issuedAt: new Date().toISOString(),
        walletType: 'wagmi'
      });
      
    } catch (err) {
      console.error('Signing error:', err);
      setStep('signing');
      
      if (err.code === 4001 || err.message?.includes('rejected')) {
        setError('Signature request was rejected. Please try again.');
      } else {
        setError(err.message || 'Failed to sign message');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card-strong border-primary/20 p-6 rounded-2xl space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-[var(--text-primary)]">Verify Ownership</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Sign a message to prove you own this wallet.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="glass-card p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--text-muted)]">Wallet Address</span>
            <span className="font-mono text-[var(--text-primary)]">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connecting...'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--text-muted)]">Network</span>
            <span className="font-medium text-[var(--text-primary)]">
              {chainId === 8453 ? 'Base' : chainId === 1 ? 'Ethereum' : `Chain ${chainId}`}
            </span>
          </div>
        </div>

        {step === 'preparing' && (
          <div className="flex items-center justify-center py-4 text-[var(--text-secondary)]">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Preparing message...
          </div>
        )}

        {step === 'signing' && message && (
          <div className="space-y-3">
            <div className="glass-card p-3 rounded-lg text-xs text-[var(--text-secondary)] max-h-24 overflow-y-auto font-mono break-words">
              {message.split('\n').slice(0, 5).join('\n')}...
            </div>
            <Button 
              onClick={handleSign}
              disabled={isSigning}
              className="w-full crypto-gradient text-white font-bold h-12"
            >
              {isSigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing...
                </>
              ) : (
                'Sign Message'
              )}
            </Button>
            <Button 
              variant="ghost" 
              onClick={onCancel}
              disabled={isSigning}
              className="w-full text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </Button>
          </div>
        )}

        {step === 'verifying' && (
          <div className="flex items-center justify-center py-4 text-[var(--text-secondary)]">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Verifying signature...
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SignatureRequestFlow;
