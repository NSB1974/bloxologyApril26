
import React, { useState } from 'react';
import { Loader2, Wallet, AlertCircle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext.jsx';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import WalletSelectionModal from './WalletSelectionModal.jsx';
import SignatureRequestFlow from './SignatureRequestFlow.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { toast } from 'sonner';

const WalletConnector = ({ onSuccess }) => {
  const { connectWallet, isConnecting, setIsConnecting, error, clearError } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [localError, setLocalError] = useState(null);

  const handleOpenModal = () => {
    clearError();
    setLocalError(null);
    setIsModalOpen(true);
  };

  const handleSelectWallet = (walletId) => {
    setSelectedWallet(walletId);
    setIsModalOpen(false);
  };

  const handleSignatureSuccess = async (signatureData) => {
    setIsConnecting(true);
    try {
      const response = await apiServerClient.fetch('/auth/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signatureData)
      });

      let data = null;
      const rawBody = await response.text();
      if (rawBody) {
        try {
          data = JSON.parse(rawBody);
        } catch (parseError) {
          throw new Error(`Unexpected server response (${response.status}): ${rawBody.slice(0, 120)}`);
        }
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || `Signature verification failed (HTTP ${response.status})`);
      }

      if (!data || !data.address || !data.jwtToken) {
        throw new Error('Invalid response from server during signature verification');
      }

      connectWallet(data.address, data.walletType, data.jwtToken);
      toast.success('Wallet connected successfully');
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error('Verification error:', err);
      setLocalError(err.message || 'Failed to verify signature');
      setSelectedWallet(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSignatureError = (err) => {
    setIsConnecting(false);
  };

  const handleCancelFlow = () => {
    setSelectedWallet(null);
  };

  const displayError = localError || error;

  if (selectedWallet) {
    return (
      <SignatureRequestFlow 
        walletName={selectedWallet}
        onSignatureSuccess={handleSignatureSuccess}
        onSignatureError={handleSignatureError}
        onCancel={handleCancelFlow}
      />
    );
  }

  return (
    <div className="space-y-6">
      {displayError && (
        <Alert variant="destructive" className="glass-card border-destructive/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleOpenModal}
        disabled={isConnecting}
        size="lg"
        className="w-full h-16 text-lg font-semibold crypto-gradient hover:opacity-90 transition-all duration-200 active:scale-[0.98]"
      >
        {isConnecting ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Wallet className="mr-2 h-5 w-5" />
        )}
        Connect Wallet
      </Button>

      <WalletSelectionModal 
        isOpen={isModalOpen} 
        onSelectWallet={handleSelectWallet} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default WalletConnector;
