import { useState, useEffect } from "react";
import { getAllTokenBalances, getChainId } from "../utils/tokens";
import type { TokenBalance } from "../types";

interface TokenListProps {
  walletAddress: string;
  isConnected: boolean;
}

export default function TokenList({ walletAddress, isConnected }: TokenListProps) {
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chainId, setChainId] = useState<number>(1);

  useEffect(() => {
    if (isConnected && walletAddress) {
      loadTokenBalances();
    } else {
      setTokenBalances([]);
    }
  }, [isConnected, walletAddress]);

  const loadTokenBalances = async () => {
    setIsLoading(true);
    try {
      const currentChainId = await getChainId();
      setChainId(currentChainId);
      
      const balances = await getAllTokenBalances(walletAddress, currentChainId);
      setTokenBalances(balances);
    } catch (error) {
      console.error("Failed to load token balances:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.000001) return '< 0.000001';
    if (num < 1) return num.toFixed(6);
    if (num < 1000) return num.toFixed(4);
    return num.toFixed(2);
  };

  const getNetworkName = (chainId: number): string => {
    switch (chainId) {
      case 1: return "Ethereum";
      case 137: return "Polygon";
      case 8453: return "Base";
      case 42161: return "Arbitrum";
      case 10: return "Optimism";
      default: return "Unknown";
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="token-list-section">
      <div className="token-list-header">
        <h3>Token Balances</h3>
        <div className="network-info">
          <span className="network-badge">{getNetworkName(chainId)}</span>
          <button 
            onClick={loadTokenBalances}
            className="refresh-button"
            disabled={isLoading}
            title="Refresh balances"
          >
            {isLoading ? "↻" : "🔄"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="token-loading">
          <div className="loading-spinner">Loading token balances...</div>
        </div>
      ) : tokenBalances.length === 0 ? (
        <div className="no-tokens">
          <div className="no-tokens-icon">🪙</div>
          <p>No token balances found</p>
          <span className="no-tokens-hint">
            Token balances will appear here when you hold ERC-20 tokens
          </span>
        </div>
      ) : (
        <div className="token-list">
          {tokenBalances.map((tokenBalance) => (
            <div key={tokenBalance.token.address} className="token-item">
              <div className="token-icon">
                {tokenBalance.token.logoUrl ? (
                  <img 
                    src={tokenBalance.token.logoUrl} 
                    alt={tokenBalance.token.name}
                    className="token-logo"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      const placeholder = img.nextElementSibling as HTMLElement;
                      img.style.display = 'none';
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="token-placeholder" style={{ display: tokenBalance.token.logoUrl ? 'none' : 'flex' }}>
                  {tokenBalance.token.symbol.charAt(0)}
                </div>
              </div>
              
              <div className="token-info">
                <div className="token-main">
                  <span className="token-name">{tokenBalance.token.name}</span>
                  <span className="token-symbol">{tokenBalance.token.symbol}</span>
                </div>
                <div className="token-balance">
                  <span className="balance-amount">
                    {formatBalance(tokenBalance.balance)} {tokenBalance.token.symbol}
                  </span>
                  {tokenBalance.usdValue && parseFloat(tokenBalance.usdValue) > 0 && (
                    <span className="balance-usd">${tokenBalance.usdValue}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}