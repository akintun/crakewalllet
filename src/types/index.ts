// Type definitions for the CrakeWallet application
import { ethers } from 'ethers';

export interface WalletState {
  isConnected: boolean;
  address: string;
  balance: string;
  isLoading: boolean;
  error: string | null;
}

export interface TransactionData {
  to: string;
  amount: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface TransactionResult {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
}

export interface TransactionHistory {
  hash: string;
  from: string;
  to: string;
  amount: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
  type: 'sent' | 'received';
  token?: TokenInfo;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  usdValue?: string;
  logoUrl?: string;
}

export interface TokenBalance {
  token: TokenInfo;
  balance: string;
  usdValue?: string;
}

export interface NetworkInfo {
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  blockExplorer: string;
  isTestnet: boolean;
}

export interface AddressBookEntry {
  id: string;
  name: string;
  address: string;
  note?: string;
  createdAt: number;
  lastUsed?: number;
}

export interface GasEstimate {
  slow: {
    gasPrice: string;
    estimatedTime: string;
    usdCost?: string;
  };
  standard: {
    gasPrice: string;
    estimatedTime: string;
    usdCost?: string;
  };
  fast: {
    gasPrice: string;
    estimatedTime: string;
    usdCost?: string;
  };
}

export interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: TransactionData) => Promise<void>;
  balance: string;
  isLoading: boolean;
  provider?: ethers.Provider | null;
}

export interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionHistory[];
  isLoading: boolean;
}

export interface ConfirmTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  transactionData: TransactionData;
  gasEstimate: GasEstimate;
  isLoading: boolean;
}

export interface ErrorState {
  message: string;
  type: 'connection' | 'transaction' | 'balance' | 'general';
  details?: string;
}

export interface AppError extends Error {
  type: ErrorState['type'];
  details?: string;
}

// Utility types
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface LoadingState {
  connecting: boolean;
  fetchingBalance: boolean;
  sendingTransaction: boolean;
  fetchingHistory: boolean;
  fetchingTokens: boolean;
}

// Network configuration types
export interface NetworkConfig {
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl?: string;
  blockExplorer?: string;
}

// Integration status types
export interface IntegrationStatus {
  ethersVersion: string;
  hasWalletConnect: boolean;
  hasMiniApp: boolean;
  appKitOpenAvailable: boolean;
  hasFarcasterWagmiConnector: boolean;
  hasAppkitAdapterWagmi: boolean;
  hasAppkitCommon: boolean;
  hasAppkitUniversalConnector: boolean;
  hasReownWalletkit: boolean;
  hasWalletConnectCore: boolean;
  hasWalletConnectTypes: boolean;
  hasWalletConnectUtils: boolean;
  hasViem: boolean;
  hasWagmi: boolean;
}