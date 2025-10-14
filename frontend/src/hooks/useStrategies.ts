import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';
import { useContract, useTransaction } from './useWeb3';
import { CONTRACT_ADDRESSES } from '../utils/constants';
import type { Strategy, RebalanceEvent } from '../types';

// StrategyManager ABI (simplified for frontend)
const STRATEGY_MANAGER_ABI = [
  'function registerStrategy(address strategy, string memory name, uint256 maxAllocation) external',
  'function activateStrategy(address strategy) external',
  'function deactivateStrategy(address strategy) external',
  'function updateAllocation(address strategy, uint256 newAllocation) external',
  'function updatePerformance(address strategy, uint256 newAPY, uint256 performanceScore) external',
  'function getActiveStrategies() external view returns (address[])',
  'function getStrategy(address strategy) external view returns (tuple(address strategyAddress, string name, uint256 allocation, uint256 maxAllocation, bool isActive, uint256 totalDeposited, uint256 totalWithdrawn, uint256 lastRebalanceTime, uint256 performanceScore))',
  'function getAllocation(address strategy) external view returns (uint256)',
  'function getActiveStrategyCount() external view returns (uint256)',
  'function isPerformingWell(address strategy) external view returns (bool)',
  'function getPerformanceMetrics(address strategy) external view returns (uint256 apy, uint256 performanceScore, uint256 lastUpdate)',
  'function totalAllocation() external view returns (uint256)',
  'event StrategyRegistered(address indexed strategy, string name, uint256 maxAllocation)',
  'event StrategyActivated(address indexed strategy)',
  'event StrategyDeactivated(address indexed strategy)',
  'event AllocationUpdated(address indexed strategy, uint256 oldAllocation, uint256 newAllocation)',
  'event PerformanceUpdated(address indexed strategy, uint256 newAPY, uint256 performanceScore)',
];

// RebalanceExecutor ABI (simplified for frontend)
const REBALANCE_EXECUTOR_ABI = [
  'function executeRebalance(address[] calldata strategies, uint256[] calldata amounts, string calldata reason) external',
  'function triggerAutoRebalance() external',
  'function analyzePerformance(address[] calldata strategies) external view returns (bool shouldRebalance, string memory reason)',
  'function calculateOptimalAllocation(address[] calldata strategies, uint256[] calldata currentAllocations) external view returns (uint256[] memory newAllocations)',
  'function getRebalanceHistory(uint256 rebalanceId) external view returns (tuple(uint256 timestamp, uint256 totalAmount, address[] strategies, uint256[] amounts, string reason))',
  'function getRebalanceCount() external view returns (uint256)',
  'function canExecuteRebalance() external view returns (bool canRebalance, uint256 timeRemaining)',
  'function getConfig() external view returns (tuple(uint256 rebalanceThreshold, uint256 maxRebalanceAmount, uint256 cooldownPeriod, bool autoRebalanceEnabled))',
  'event RebalanceExecuted(uint256 indexed rebalanceId, uint256 timestamp, uint256 totalAmount, address[] strategies, uint256[] amounts, string reason)',
];

// Strategies hook
export function useStrategies() {
  const { isConnected } = useWeb3();
  const { contract: strategyManager, contractWithSigner: strategyManagerWithSigner, isReady } = useContract(
    CONTRACT_ADDRESSES.localhost.StrategyManager,
    STRATEGY_MANAGER_ABI
  );
  const { executeTransaction, isLoading, error, txHash } = useTransaction();

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load strategies
  const loadStrategies = useCallback(async () => {
    if (!strategyManager) return;

    try {
      setIsLoadingData(true);
      
      const activeStrategies = await strategyManager.getActiveStrategies();
      const strategyPromises = activeStrategies.map(async (address: string) => {
        const strategyData = await strategyManager.getStrategy(address);
        const [apy, performanceScore] = await strategyManager.getPerformanceMetrics(address);
        
        return {
          address,
          name: strategyData.name,
          allocation: Number(strategyData.allocation) / 100, // Convert from basis points
          maxAllocation: Number(strategyData.maxAllocation) / 100,
          isActive: strategyData.isActive,
          totalDeposited: ethers.formatEther(strategyData.totalDeposited),
          totalWithdrawn: ethers.formatEther(strategyData.totalWithdrawn),
          performanceScore: Number(performanceScore),
          apy: Number(apy) / 100, // Convert from basis points
        };
      });

      const strategiesData = await Promise.all(strategyPromises);
      setStrategies(strategiesData);
    } catch (err) {
      console.error('Error loading strategies:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [strategyManager]);

  // Register strategy
  const registerStrategy = useCallback(async (address: string, name: string, maxAllocation: number) => {
    if (!strategyManagerWithSigner) return;

    const maxAllocationBasisPoints = maxAllocation * 100; // Convert to basis points

    await executeTransaction(
      () => (strategyManagerWithSigner as any).registerStrategy(address, name, maxAllocationBasisPoints),
      {
        onSuccess: () => {
          loadStrategies();
        },
      }
    );
  }, [strategyManagerWithSigner, executeTransaction, loadStrategies]);

  // Activate strategy
  const activateStrategy = useCallback(async (address: string) => {
    if (!strategyManagerWithSigner) return;

    await executeTransaction(
      () => (strategyManagerWithSigner as any).activateStrategy(address),
      {
        onSuccess: () => {
          loadStrategies();
        },
      }
    );
  }, [strategyManagerWithSigner, executeTransaction, loadStrategies]);

  // Deactivate strategy
  const deactivateStrategy = useCallback(async (address: string) => {
    if (!strategyManagerWithSigner) return;

    await executeTransaction(
      () => (strategyManagerWithSigner as any).deactivateStrategy(address),
      {
        onSuccess: () => {
          loadStrategies();
        },
      }
    );
  }, [strategyManagerWithSigner, executeTransaction, loadStrategies]);

  // Update allocation
  const updateAllocation = useCallback(async (address: string, newAllocation: number) => {
    if (!strategyManagerWithSigner) return;

    const allocationBasisPoints = newAllocation * 100; // Convert to basis points

    await executeTransaction(
      () => (strategyManagerWithSigner as any).updateAllocation(address, allocationBasisPoints),
      {
        onSuccess: () => {
          loadStrategies();
        },
      }
    );
  }, [strategyManagerWithSigner, executeTransaction, loadStrategies]);

  // Refresh data
  const refreshData = useCallback(() => {
    loadStrategies();
  }, [loadStrategies]);

  // Load data on mount and when wallet connects
  useEffect(() => {
    if (isReady && isConnected) {
      refreshData();
    }
  }, [isReady, isConnected, refreshData]);

  return {
    strategies,
    isLoadingData,
    isLoading,
    error,
    txHash,
    registerStrategy,
    activateStrategy,
    deactivateStrategy,
    updateAllocation,
    refreshData,
    isReady,
  };
}

// Rebalancing hook
export function useRebalancing() {
  const { contract: rebalanceExecutor, contractWithSigner: rebalanceExecutorWithSigner, isReady } = useContract(
    CONTRACT_ADDRESSES.localhost.RebalanceExecutor,
    REBALANCE_EXECUTOR_ABI
  );
  const { executeTransaction, isLoading, error, txHash } = useTransaction();

  const [rebalanceHistory, setRebalanceHistory] = useState<RebalanceEvent[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load rebalance history
  const loadRebalanceHistory = useCallback(async () => {
    if (!rebalanceExecutor) return;

    try {
      setIsLoadingData(true);
      
      const count = await rebalanceExecutor.getRebalanceCount();
      const historyPromises = [];
      
      for (let i = 0; i < Number(count); i++) {
        historyPromises.push(rebalanceExecutor.getRebalanceHistory(i));
      }
      
      const historyData = await Promise.all(historyPromises);
      const formattedHistory = historyData.map((event, index) => ({
        id: index,
        timestamp: Number(event.timestamp) * 1000, // Convert to milliseconds
        totalAmount: ethers.formatEther(event.totalAmount),
        strategies: event.strategies,
        amounts: event.amounts.map((amount: any) => ethers.formatEther(amount)),
        reason: event.reason,
      }));
      
      setRebalanceHistory(formattedHistory);
    } catch (err) {
      console.error('Error loading rebalance history:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [rebalanceExecutor]);

  // Execute rebalancing
  const executeRebalancing = useCallback(async (
    strategies: string[],
    amounts: string[],
    reason: string
  ) => {
    if (!rebalanceExecutorWithSigner) return;

    const amountsWei = amounts.map(amount => ethers.parseEther(amount));

    await executeTransaction(
      () => (rebalanceExecutorWithSigner as any).executeRebalance(strategies, amountsWei, reason),
      {
        onSuccess: () => {
          loadRebalanceHistory();
        },
      }
    );
  }, [rebalanceExecutorWithSigner, executeTransaction, loadRebalanceHistory]);

  // Trigger auto rebalancing
  const triggerAutoRebalancing = useCallback(async () => {
    if (!rebalanceExecutorWithSigner) return;

    await executeTransaction(
      () => (rebalanceExecutorWithSigner as any).triggerAutoRebalance(),
      {
        onSuccess: () => {
          loadRebalanceHistory();
        },
      }
    );
  }, [rebalanceExecutorWithSigner, executeTransaction, loadRebalanceHistory]);

  // Analyze performance
  const analyzePerformance = useCallback(async (strategies: string[]) => {
    if (!rebalanceExecutor) return { shouldRebalance: false, reason: 'Unable to analyze' };

    try {
      const result = await rebalanceExecutor.analyzePerformance(strategies);
      return {
        shouldRebalance: result.shouldRebalance,
        reason: result.reason,
      };
    } catch (err) {
      console.error('Error analyzing performance:', err);
      return { shouldRebalance: false, reason: 'Analysis failed' };
    }
  }, [rebalanceExecutor]);

  // Refresh data
  const refreshData = useCallback(() => {
    loadRebalanceHistory();
  }, [loadRebalanceHistory]);

  // Load data on mount
  useEffect(() => {
    if (isReady) {
      refreshData();
    }
  }, [isReady, refreshData]);

  return {
    rebalanceHistory,
    isLoadingData,
    isLoading,
    error,
    txHash,
    executeRebalancing,
    triggerAutoRebalancing,
    analyzePerformance,
    refreshData,
    isReady,
  };
}