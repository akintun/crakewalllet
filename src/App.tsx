import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { appKit } from "./config";
import { useAppKit, useAppKitState } from "@reown/appkit/react";
import "./App.css";
import Integrations from "./integrations/Integrations";
import SendModal from "./components/SendModal";
import ReceiveModal from "./components/ReceiveModal";
import TransactionHistoryModal from "./components/TransactionHistory";
import TokenList from "./components/TokenList";
import NetworkSwitcher from "./components/NetworkSwitcher";
import PortfolioStats from "./components/PortfolioStats";
import { getEthBalance, sendTransaction } from "./utils/balance";
import { getTransactionHistory, saveTransaction, monitorPendingTransactions } from "./utils/transactionHistory";
import type { WalletState, ErrorState, LoadingState, TransactionData, TransactionHistory } from "./types";

function App() {
  const { open } = useAppKit();
  const appKitState = useAppKitState();
  
  // Consolidated state management
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: "",
    balance: "",
    isLoading: false,
    error: null,
  });
  
  const [loadingState, setLoadingState] = useState<LoadingState>({
    connecting: false,
    fetchingBalance: false,
    sendingTransaction: false,
    fetchingHistory: false,
    fetchingTokens: false,
  });
  
  const [error, setError] = useState<ErrorState | null>(null);
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  
  // Modal states
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Transaction history state
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);
  const [tokens, setTokens] = useState<Array<{ symbol: string; balance: string; address: string }>>([]);

  const isConnected = !!appKitState.activeChain;
  const address = isConnected ? appKit.getAddress() : "";

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Initialize provider when connected
  useEffect(() => {
    const initializeProvider = async () => {
      if (isConnected) {
        try {
          // Use a default Ethereum mainnet provider for gas estimation
          const ethersProvider = new ethers.JsonRpcProvider('https://ethereum-rpc.publicnode.com');
          setProvider(ethersProvider);
        } catch (error) {
          console.error('Failed to initialize provider:', error);
          setProvider(null);
        }
      } else {
        setProvider(null);
      }
    };

    initializeProvider();
  }, [isConnected]);

  // Update wallet state when connection changes
  useEffect(() => {
    setWalletState(prev => ({
      ...prev,
      isConnected,
      address: address || "",
    }));
    
    // Load transaction history when connected
    if (isConnected && address) {
      loadTransactionHistory();
    }
  }, [isConnected, address]);

  // Load transaction history
  const loadTransactionHistory = async () => {
    if (!address) return;
    
    setLoadingState(prev => ({ ...prev, fetchingHistory: true }));
    try {
      const history = getTransactionHistory(address);
      setTransactionHistory(history);
      
      // Monitor pending transactions
      await monitorPendingTransactions();
      
      // Reload history after monitoring (in case statuses changed)
      const updatedHistory = getTransactionHistory(address);
      setTransactionHistory(updatedHistory);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    } finally {
      setLoadingState(prev => ({ ...prev, fetchingHistory: false }));
    }
  };

  // Update balance when connected
  useEffect(() => {
    let mounted = true;
    
    async function fetchBalance() {
      if (isConnected && address) {
        setLoadingState(prev => ({ ...prev, fetchingBalance: true }));
        setError(null);
        
        try {
          const b = await getEthBalance(address);
          if (mounted) {
            setWalletState(prev => ({ ...prev, balance: b, error: null }));
          }
        } catch (e) {
          console.warn("Balance fetch failed", e);
          if (mounted) {
            const errorMsg = e instanceof Error ? e.message : "Failed to fetch balance";
            setError({
              message: errorMsg,
              type: "balance",
              details: "Unable to retrieve wallet balance. Please try again.",
            });
            setWalletState(prev => ({ ...prev, balance: "0.0" }));
          }
        } finally {
          if (mounted) {
            setLoadingState(prev => ({ ...prev, fetchingBalance: false }));
          }
        }
      } else {
        setWalletState(prev => ({ ...prev, balance: "" }));
      }
    }
    
    fetchBalance();
    return () => {
      mounted = false;
    };
  }, [isConnected, address]);

  // Connect to wallet (opens modal with embedded wallet option)
  const handleConnect = async () => {
    setLoadingState(prev => ({ ...prev, connecting: true }));
    setError(null);
    
    try {
      await open();
    } catch (error) {
      console.error("Failed to connect:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to connect wallet";
      setError({
        message: errorMsg,
        type: "connection",
        details: "Please check your wallet and try again.",
      });
    } finally {
      setLoadingState(prev => ({ ...prev, connecting: false }));
    }
  };

  // Disconnect wallet
  const handleDisconnect = async () => {
    setError(null);
    try {
      await appKit.disconnect();
      setWalletState({
        isConnected: false,
        address: "",
        balance: "",
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to disconnect:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to disconnect wallet";
      setError({
        message: errorMsg,
        type: "connection",
        details: "Please try again or refresh the page.",
      });
    }
  };

  // Handle send transaction
  const handleSendTransaction = async (transactionData: TransactionData) => {
    setLoadingState(prev => ({ ...prev, sendingTransaction: true }));
    setError(null);

    try {
      const result = await sendTransaction(transactionData);
      console.log("Transaction sent:", result);
      
      // Save transaction to history
      const newTransaction: TransactionHistory = {
        hash: result.hash,
        from: walletState.address,
        to: transactionData.to,
        amount: transactionData.amount,
        status: result.status,
        timestamp: result.timestamp,
        type: 'sent',
      };
      
      saveTransaction(newTransaction);
      
      // Update local history state
      setTransactionHistory(prev => [newTransaction, ...prev]);
      
      // Refresh balance after transaction
      setTimeout(() => {
        if (isConnected && address) {
          // Trigger balance refresh by updating a dependency
          setWalletState(prev => ({ ...prev, balance: "0.0" }));
        }
      }, 1000);
      
    } catch (error) {
      console.error("Transaction failed:", error);
      const errorMsg = error instanceof Error ? error.message : "Transaction failed";
      setError({
        message: errorMsg,
        type: "transaction",
        details: "Please check your transaction details and try again.",
      });
      throw error; // Re-throw to let modal handle it
    } finally {
      setLoadingState(prev => ({ ...prev, sendingTransaction: false }));
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>CrakeWallet</h1>
        <p>A modern crypto wallet application</p>
        
        {/* Network Switcher */}
        <NetworkSwitcher isConnected={isConnected} />
        
        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error.message}
            {error.details && <div className="error-details">{error.details}</div>}
          </div>
        )}
      </header>

      <main className="app-main">
        {!isConnected ? (
          <div className="connect-section">
            <h2>Connect Your Wallet</h2>
            <p>
              Connect to your favorite wallet or create a new embedded wallet to
              start managing your crypto assets securely.
            </p>
            <button
              onClick={handleConnect}
              disabled={loadingState.connecting}
              className="connect-button"
            >
              {loadingState.connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        ) : (
          <div className="wallet-section">
            <h2>Wallet Connected</h2>
            <div className="wallet-info">
              <p>
                <strong>Address:</strong> {walletState.address}
              </p>
              <p>
                <strong>Balance:</strong> 
                {loadingState.fetchingBalance ? (
                  <span className="loading">Loading...</span>
                ) : (
                  `${walletState.balance} ETH`
                )}
              </p>
            </div>
            
            <PortfolioStats
              address={walletState.address}
              balance={walletState.balance}
              provider={provider}
              tokens={tokens}
            />
            
            <div className="action-buttons">
              <button
                onClick={() => setShowSendModal(true)}
                className="send-button"
                disabled={loadingState.sendingTransaction || !walletState.balance || walletState.balance === "0.0"}
              >
                Send
              </button>
              <button
                onClick={() => setShowReceiveModal(true)}
                className="receive-button"
              >
                Receive
              </button>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="history-button"
                disabled={loadingState.fetchingHistory}
              >
                {loadingState.fetchingHistory ? "Loading..." : "History"}
              </button>
              <button onClick={handleDisconnect} className="disconnect-button">
                Disconnect
              </button>
            </div>
          </div>
        )}
        
        {/* Token List */}
        <TokenList 
          walletAddress={walletState.address}
          isConnected={isConnected}
        />
        
        <Integrations />
      </main>

      {/* Modals */}
      <SendModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSend={handleSendTransaction}
        balance={walletState.balance}
        isLoading={loadingState.sendingTransaction}
        provider={provider}
      />
      
      <ReceiveModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        address={walletState.address}
      />
      
      <TransactionHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        transactions={transactionHistory}
        isLoading={loadingState.fetchingHistory}
      />
    </div>
  );
}

export default App;