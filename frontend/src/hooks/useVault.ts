import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';
import { useContract, useTransaction } from './useWeb3';
import { CONTRACT_ADDRESSES, APP_CONFIG } from '../utils/constants';
import type { VaultInfo, UserVaultData } from '../types';

// AutoFiVault ABI (simplified for frontend)
const AUTO_FI_VAULT_ABI = [
  'function deposit(uint256 amount) external returns (uint256 shares)',
  'function withdraw(uint256 shares) external returns (uint256 amount)',
  'function totalAssets() external view returns (uint256)',
  'function totalShares() external view returns (uint256)',
  'function balances(address user) external view returns (uint256)',
  'function getUserShare(address user) external view returns (uint256)',
  'function getTVL() external view returns (uint256)',
  'function isLocked(address user) external view returns (bool)',
  'function asset() external view returns (address)',
  'function rewardToken() external view returns (address)',
  'function strategyManager() external view returns (address)',
  'function rebalanceExecutor() external view returns (address)',
  'function pause() external',
  'function unpause() external',
  'function paused() external view returns (bool)',
  'event Deposit(address indexed user, uint256 amount, uint256 shares)',
  'event Withdraw(address indexed user, uint256 amount, uint256 shares)',
  'event StrategyExecuted(address indexed strategy, uint256 amount)',
  'event RebalanceExecuted(uint256 timestamp)',
];

// Vault hook
export function useVault() {
  const { walletInfo, isConnected } = useWeb3();
  const { contract, contractWithSigner, isReady } = useContract(
    CONTRACT_ADDRESSES.localhost.AutoFiVault,
    AUTO_FI_VAULT_ABI
  );
  const { executeTransaction, isLoading, error, txHash } = useTransaction();

  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [userVaultData, setUserVaultData] = useState<UserVaultData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load vault information
  const loadVaultInfo = useCallback(async () => {
    if (!contract) return;

    try {
      setIsLoadingData(true);
      
      const [
        totalAssets,
        totalShares,
        assetToken,
        rewardToken,
      ] = await Promise.all([
        contract.totalAssets(),
        contract.totalShares(),
        contract.asset(),
        contract.rewardToken(),
      ]);

      setVaultInfo({
        address: CONTRACT_ADDRESSES.localhost.AutoFiVault,
        totalAssets: ethers.formatUnits(totalAssets, 6), // USDC has 6 decimals
        totalShares: ethers.formatUnits(totalShares, 6),
        assetToken,
        rewardToken,
        minDeposit: APP_CONFIG.minDeposit,
        lockPeriod: APP_CONFIG.lockPeriod,
      });
    } catch (err) {
      console.error('Error loading vault info:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [contract]);

  // Load user vault data
  const loadUserVaultData = useCallback(async () => {
    if (!contract || !walletInfo?.address) return;

    try {
      const [balance, shares, sharePercentage, isLocked] = await Promise.all([
        contract.balances(walletInfo.address),
        contract.balances(walletInfo.address), // Same as balance for now
        contract.getUserShare(walletInfo.address),
        contract.isLocked(walletInfo.address),
      ]);

      setUserVaultData({
        balance: ethers.formatUnits(balance, 6),
        shares: ethers.formatUnits(shares, 6),
        sharePercentage: Number(sharePercentage) / 100, // Convert from basis points
        isLocked,
        lastDepositTime: Date.now() - APP_CONFIG.lockPeriod, // Placeholder
      });
    } catch (err) {
      console.error('Error loading user vault data:', err);
    }
  }, [contract, walletInfo?.address]);

  // Deposit function
  const deposit = useCallback(async (amount: string) => {
    if (!contractWithSigner || !walletInfo?.address) return;

    const amountWei = ethers.parseUnits(amount, 6); // USDC has 6 decimals

    await executeTransaction(
      () => (contractWithSigner as any).deposit(amountWei),
      {
        onSuccess: () => {
          loadVaultInfo();
          loadUserVaultData();
        },
      }
    );
  }, [contractWithSigner, walletInfo?.address, executeTransaction, loadVaultInfo, loadUserVaultData]);

  // Withdraw function
  const withdraw = useCallback(async (shares: string) => {
    if (!contractWithSigner || !walletInfo?.address) return;

    const sharesWei = ethers.parseUnits(shares, 6);

    await executeTransaction(
      () => (contractWithSigner as any).withdraw(sharesWei),
      {
        onSuccess: () => {
          loadVaultInfo();
          loadUserVaultData();
        },
      }
    );
  }, [contractWithSigner, walletInfo?.address, executeTransaction, loadVaultInfo, loadUserVaultData]);

  // Refresh data
  const refreshData = useCallback(() => {
    loadVaultInfo();
    loadUserVaultData();
  }, [loadVaultInfo, loadUserVaultData]);

  // Load data on mount and when wallet connects
  useEffect(() => {
    if (isReady && isConnected) {
      refreshData();
    }
  }, [isReady, isConnected, refreshData]);

  return {
    vaultInfo,
    userVaultData,
    isLoadingData,
    isLoading,
    error,
    txHash,
    deposit,
    withdraw,
    refreshData,
    isReady,
  };
}

// Vault analytics hook
export function useVaultAnalytics() {
  const { vaultInfo } = useVault();
  const [analytics, setAnalytics] = useState({
    apy: 0,
    totalYield: '0',
    riskScore: 0,
    performanceHistory: [] as Array<{ date: string; value: number }>,
  });

  useEffect(() => {
    if (vaultInfo) {
      // Mock analytics data - in real app, this would come from API
      setAnalytics({
        apy: 12.5, // 12.5% APY
        totalYield: '1250.00',
        riskScore: 3.2, // Out of 10
        performanceHistory: [
          { date: '2024-01-01', value: 1000 },
          { date: '2024-01-02', value: 1010 },
          { date: '2024-01-03', value: 1025 },
          { date: '2024-01-04', value: 1035 },
          { date: '2024-01-05', value: 1050 },
        ],
      });
    }
  }, [vaultInfo]);

  return analytics;
}