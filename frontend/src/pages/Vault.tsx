import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVault } from '../hooks/useVault';
import { useWeb3Context } from '../contexts/Web3Context';
import { formatCurrency, formatPercentage } from '../utils';
import DepositModal from '../components/vault/DepositModal';
import WithdrawModal from '../components/vault/WithdrawModal';
import VaultStats from '../components/vault/VaultStats';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Vault() {
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');
  
  const { vaultInfo, userVaultData, isLoadingData, deposit, withdraw } = useVault();
  const { isConnected } = useWeb3Context();
  
  const [showDepositModal, setShowDepositModal] = useState(action === 'deposit');
  const [showWithdrawModal, setShowWithdrawModal] = useState(action === 'withdraw');

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Vault Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Deposit, withdraw, and monitor your vault performance.
        </p>
      </div>

      {/* Vault Stats */}
      <VaultStats
        vaultInfo={vaultInfo}
        userVaultData={userVaultData}
        isConnected={isConnected}
      />

      {/* Action Buttons */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Actions
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your vault deposits and withdrawals
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setShowDepositModal(true)}
            disabled={!isConnected}
            className="btn-primary flex-1 flex items-center justify-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Deposit Funds
          </button>
          
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!isConnected || !userVaultData || userVaultData.isLocked}
            className="btn-outline flex-1 flex items-center justify-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4m16 0l-4-4m4 4l-4 4" />
            </svg>
            Withdraw Funds
          </button>
        </div>

        {!isConnected && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Please connect your wallet to deposit or withdraw funds.
            </p>
          </div>
        )}

        {isConnected && userVaultData?.isLocked && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Your funds are currently locked for security. Withdrawals will be available after the lock period ends.
            </p>
          </div>
        )}
      </div>

      {/* User Balance Details */}
      {isConnected && userVaultData && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Your Vault Position
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(userVaultData.balance)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Balance
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(userVaultData.shares)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Vault Shares
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatPercentage(userVaultData.sharePercentage)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Share Percentage
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                userVaultData.isLocked
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {userVaultData.isLocked ? 'Locked' : 'Available'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Status
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onDeposit={deposit}
        vaultInfo={vaultInfo}
      />
      
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onWithdraw={withdraw}
        userVaultData={userVaultData}
      />
    </div>
  );
}