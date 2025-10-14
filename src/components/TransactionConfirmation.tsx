import React from 'react';
import { ethers } from 'ethers';

interface TransactionConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transaction: {
    to: string;
    amount: string;
    gasLimit?: string;
    gasPrice?: string;
  };
  estimatedCost?: string;
  isLoading: boolean;
}

const TransactionConfirmation: React.FC<TransactionConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  transaction,
  estimatedCost,
  isLoading
}) => {
  if (!isOpen) return null;

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const calculateTotalCost = (): string => {
    const amount = parseFloat(transaction.amount) || 0;
    const gasCost = parseFloat(estimatedCost || '0');
    return (amount + gasCost).toFixed(6);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content confirmation-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Confirm Transaction</h2>
          <button
            onClick={onClose}
            className="close-button"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <div className="confirmation-content">
          <div className="transaction-summary">
            <div className="summary-section">
              <h3>Transaction Details</h3>
              <div className="detail-row">
                <span className="label">Sending:</span>
                <span className="value">{transaction.amount} ETH</span>
              </div>
              <div className="detail-row">
                <span className="label">To:</span>
                <span className="value monospace">{formatAddress(transaction.to)}</span>
              </div>
            </div>

            {estimatedCost && (
              <div className="summary-section">
                <h3>Gas Fee</h3>
                <div className="detail-row">
                  <span className="label">Estimated Cost:</span>
                  <span className="value">{estimatedCost} ETH</span>
                </div>
                {transaction.gasLimit && (
                  <div className="detail-row">
                    <span className="label">Gas Limit:</span>
                    <span className="value">{transaction.gasLimit}</span>
                  </div>
                )}
                {transaction.gasPrice && (
                  <div className="detail-row">
                    <span className="label">Gas Price:</span>
                    <span className="value">{ethers.formatUnits(transaction.gasPrice, 'gwei')} Gwei</span>
                  </div>
                )}
              </div>
            )}

            <div className="summary-section total-section">
              <div className="detail-row total-row">
                <span className="label">Total Cost:</span>
                <span className="value total-value">{calculateTotalCost()} ETH</span>
              </div>
            </div>
          </div>

          <div className="security-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <strong>Important:</strong> Double-check the recipient address and amount before confirming. 
              Transactions cannot be reversed.
            </div>
          </div>

          <div className="confirmation-actions">
            <button
              onClick={onClose}
              className="cancel-button"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="confirm-button"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Confirm & Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionConfirmation;