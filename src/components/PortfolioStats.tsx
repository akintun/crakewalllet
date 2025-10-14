import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface PortfolioStatsProps {
  address: string;
  balance: string;
  provider?: ethers.Provider | null;
  tokens: Array<{
    symbol: string;
    balance: string;
    address: string;
  }>;
}

interface PortfolioData {
  totalValueUSD: number;
  ethValueUSD: number;
  tokensValueUSD: number;
  transactionCount: number;
  firstTransaction: Date | null;
}

const PortfolioStats: React.FC<PortfolioStatsProps> = ({
  address,
  balance,
  provider,
  tokens
}) => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    totalValueUSD: 0,
    ethValueUSD: 0,
    tokensValueUSD: 0,
    transactionCount: 0,
    firstTransaction: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [ethPrice, setEthPrice] = useState<number>(0);

  useEffect(() => {
    if (address && provider) {
      fetchPortfolioData();
    }
  }, [address, provider, balance, tokens]);

  const fetchEthPrice = async (): Promise<number> => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await response.json();
      return data.ethereum?.usd || 0;
    } catch (error) {
      console.error('Failed to fetch ETH price:', error);
      return 0;
    }
  };

  const fetchTransactionCount = async (): Promise<number> => {
    if (!provider) return 0;
    try {
      return await provider.getTransactionCount(address);
    } catch (error) {
      console.error('Failed to fetch transaction count:', error);
      return 0;
    }
  };

  const fetchPortfolioData = async () => {
    setIsLoading(true);
    try {
      const [ethPrice, txCount] = await Promise.all([
        fetchEthPrice(),
        fetchTransactionCount()
      ]);

      setEthPrice(ethPrice);
      
      const ethValue = parseFloat(balance) || 0;
      const ethValueUSD = ethValue * ethPrice;
      
      // For simplicity, we'll just calculate ETH value
      // In a real app, you'd fetch token prices too
      const tokensValueUSD = 0; // tokens.reduce(() => {}, 0);
      
      setPortfolioData({
        totalValueUSD: ethValueUSD + tokensValueUSD,
        ethValueUSD,
        tokensValueUSD,
        transactionCount: txCount,
        firstTransaction: null // Would need to fetch first transaction
      });
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (isLoading) {
    return (
      <div className="portfolio-stats">
        <div className="portfolio-header">
          <h3>Portfolio Overview</h3>
        </div>
        <div className="loading">Loading portfolio data...</div>
      </div>
    );
  }

  return (
    <div className="portfolio-stats">
      <div className="portfolio-header">
        <h3>Portfolio Overview</h3>
        <button
          onClick={fetchPortfolioData}
          className="refresh-button"
          title="Refresh portfolio data"
        >
          🔄
        </button>
      </div>

      <div className="portfolio-grid">
        <div className="portfolio-card">
          <div className="portfolio-card-label">Total Value</div>
          <div className="portfolio-card-value primary">
            {formatCurrency(portfolioData.totalValueUSD)}
          </div>
        </div>

        <div className="portfolio-card">
          <div className="portfolio-card-label">ETH Value</div>
          <div className="portfolio-card-value">
            {formatCurrency(portfolioData.ethValueUSD)}
          </div>
          <div className="portfolio-card-detail">
            {balance} ETH @ {formatCurrency(ethPrice)}
          </div>
        </div>

        <div className="portfolio-card">
          <div className="portfolio-card-label">Tokens</div>
          <div className="portfolio-card-value">
            {tokens.length}
          </div>
          <div className="portfolio-card-detail">
            {formatCurrency(portfolioData.tokensValueUSD)} value
          </div>
        </div>

        <div className="portfolio-card">
          <div className="portfolio-card-label">Transactions</div>
          <div className="portfolio-card-value">
            {formatNumber(portfolioData.transactionCount)}
          </div>
          <div className="portfolio-card-detail">
            Total sent & received
          </div>
        </div>
      </div>

      <div className="wallet-address">
        <div className="address-label">Wallet Address</div>
        <div className="address-value">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(address)}
          className="copy-button"
          title="Copy address"
        >
          📋
        </button>
      </div>
    </div>
  );
};

export default PortfolioStats;