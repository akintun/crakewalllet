// Type definitions for the CrakeWallet application

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

export interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: TransactionData) => Promise<void>;
  balance: string;
  isLoading: boolean;
}

export interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
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