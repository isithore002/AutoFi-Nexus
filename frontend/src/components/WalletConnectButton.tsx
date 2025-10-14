import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3Context } from '../contexts/Web3Context';
import { ERROR_MESSAGES } from '../utils/constants';
import { Wallet, AlertTriangle } from 'lucide-react';

export default function WalletConnectButton() {
  const { connectWallet, isConnecting, isConnected, error } = useWeb3Context();
  const [showError, setShowError] = useState(false);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={!isConnected ? handleConnect : undefined}
        disabled={isConnecting || isConnected}
        className="btn-primary flex items-center gap-x-3 px-6 py-3"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        aria-busy={isConnecting}
      >
        {isConnecting ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            <span className="font-semibold">Connecting...</span>
          </>
        ) : isConnected ? (
          <>
            <Wallet className="h-5 w-5" />
            <span className="font-semibold">Wallet Connected</span>
          </>
        ) : (
          <>
            <Wallet className="h-5 w-5" />
            <span className="font-semibold">Connect Wallet</span>
          </>
        )}
      </motion.button>

      {/* Error message */}
      <AnimatePresence>
        {showError && error && (
          <motion.div 
            className="absolute top-full mt-3 right-0 glass-effect border border-red-500/30 rounded-2xl p-4 shadow-glow z-50 min-w-80"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-red-500/20 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-1">
                  Connection Failed
                </h3>
                <p className="text-sm text-gray-300">
                  {error.message || ERROR_MESSAGES.WALLET_NOT_CONNECTED}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}