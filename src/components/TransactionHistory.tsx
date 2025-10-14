import { useState } from "react";
import type { TransactionHistoryProps, TransactionHistory } from "../types";

export default function TransactionHistoryModal({ 
  isOpen, 
  onClose, 
  transactions, 
  isLoading 
}: TransactionHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: string, symbol = 'ETH'): string => {
    const num = parseFloat(amount);
    if (num === 0) return '0';
    if (num < 0.001) return '< 0.001';
    return `${num.toFixed(6)} ${symbol}`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusIcon = (status: TransactionHistory['status']) => {
    switch (status) {
      case 'confirmed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'failed':
        return '❌';
    }
  };

  const getTypeIcon = (type: TransactionHistory['type']) => {
    return type === 'sent' ? '📤' : '📥';
  };

  const openInExplorer = (hash: string) => {
    // Default to Ethereum mainnet explorer
    const explorerUrl = `https://etherscan.io/tx/${hash}`;
    window.open(explorerUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content transaction-history-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Transaction History</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="transaction-history-content">
          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-tab ${filter === 'sent' ? 'active' : ''}`}
              onClick={() => setFilter('sent')}
            >
              Sent
            </button>
            <button 
              className={`filter-tab ${filter === 'received' ? 'active' : ''}`}
              onClick={() => setFilter('received')}
            >
              Received
            </button>
          </div>

          {/* Transaction List */}
          <div className="transaction-list">
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner">Loading transactions...</div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h4>No transactions found</h4>
                <p>Your transaction history will appear here once you start using the wallet.</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div key={tx.hash} className="transaction-item">
                  <div className="transaction-main">
                    <div className="transaction-icon">
                      {getTypeIcon(tx.type)}
                    </div>
                    
                    <div className="transaction-info">
                      <div className="transaction-title">
                        <span className={`transaction-type ${tx.type}`}>
                          {tx.type === 'sent' ? 'Sent' : 'Received'}
                        </span>
                        <span className="transaction-status">
                          {getStatusIcon(tx.status)} {tx.status}
                        </span>
                      </div>
                      
                      <div className="transaction-details">
                        <div className="transaction-addresses">
                          {tx.type === 'sent' ? (
                            <span>To: {formatAddress(tx.to)}</span>
                          ) : (
                            <span>From: {formatAddress(tx.from)}</span>
                          )}
                        </div>
                        <div className="transaction-amount">
                          <span className={tx.type}>
                            {tx.type === 'sent' ? '-' : '+'}{formatAmount(tx.amount, tx.token?.symbol)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="transaction-meta">
                        <span className="transaction-date">{formatDate(tx.timestamp)}</span>
                        {tx.gasUsed && (
                          <span className="transaction-gas">
                            Gas: {parseFloat(tx.gasUsed).toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="transaction-actions">
                    <button 
                      className="explorer-button"
                      onClick={() => openInExplorer(tx.hash)}
                      title="View in block explorer"
                    >
                      🔗
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}