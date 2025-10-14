// Add window.ethereum type declaration
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { NETWORKS } from '../utils/constants';
import type { WalletInfo, AppError } from '../types';

// Web3 provider hook
export function useWeb3() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  // Check if wallet is connected
  const checkConnection = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      setError({
        code: 'NO_WALLET',
        message: 'No wallet detected. Please install MetaMask.',
      });
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);
        const network = await provider.getNetwork();

        setProvider(provider);
        setSigner(signer);
        setWalletInfo({
          address,
          balance: ethers.formatEther(balance),
          chainId: Number(network.chainId),
          isConnected: true,
        });
        setIsConnected(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error checking connection:', err);
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      setError({
        code: 'NO_WALLET',
        message: 'No wallet detected. Please install MetaMask.',
      });
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);
        const network = await provider.getNetwork();

        setProvider(provider);
        setSigner(signer);
        setWalletInfo({
          address,
          balance: ethers.formatEther(balance),
          chainId: Number(network.chainId),
          isConnected: true,
        });
        setIsConnected(true);
      }
    } catch (err: any) {
      setError({
        code: 'CONNECTION_FAILED',
        message: err.message || 'Failed to connect wallet',
      });
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setWalletInfo(null);
    setIsConnected(false);
    setError(null);
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (chainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (err: any) {
      if (err.code === 4902) {
        // Chain not added, try to add it
        const network = Object.values(NETWORKS).find(n => n.chainId === chainId);
        if (network) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${chainId.toString(16)}`,
              chainName: network.name,
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: network.blockExplorer ? [network.blockExplorer] : undefined,
            }],
          });
        }
      }
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        checkConnection();
      }
    };

    const handleChainChanged = () => {
      checkConnection();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Check initial connection
    checkConnection();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [checkConnection, disconnectWallet]);

  return {
    provider,
    signer,
    walletInfo,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    checkConnection,
  };
}

// Contract interaction hook
export function useContract(contractAddress: string, abi: any[]) {
  const { provider, signer, isConnected } = useWeb3();
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    if (provider && contractAddress && abi) {
      const contractInstance = new ethers.Contract(contractAddress, abi, provider);
      setContract(contractInstance);
    }
  }, [provider, contractAddress, abi]);

  const getContractWithSigner = useCallback(() => {
    if (contract && signer) {
      return contract.connect(signer);
    }
    return null;
  }, [contract, signer]);

  return {
    contract,
    contractWithSigner: getContractWithSigner(),
    isReady: !!contract && isConnected,
  };
}

// Transaction hook
export function useTransaction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const executeTransaction = useCallback(async (
    txFunction: () => Promise<any>,
    options?: {
      onSuccess?: (result: any) => void;
      onError?: (error: any) => void;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const result = await txFunction();
      
      if (result && result.hash) {
        setTxHash(result.hash);
        
        // Wait for confirmation
        await result.wait();
        
        options?.onSuccess?.(result);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Transaction failed';
      setError({
        code: 'TRANSACTION_FAILED',
        message: errorMessage,
        details: err,
      });
      options?.onError?.(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetTransaction = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setTxHash(null);
  }, []);

  return {
    isLoading,
    error,
    txHash,
    executeTransaction,
    resetTransaction,
  };
}