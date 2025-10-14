import React, { useState } from "react";
import { ethers } from "ethers";
import type { SendModalProps, TransactionData } from "../types";

export default function SendModal({ 
  isOpen, 
  onClose, 
  onSend, 
  balance, 
  isLoading 
}: SendModalProps) {
  const [formData, setFormData] = useState<TransactionData>({
    to: "",
    amount: "",
  });
  const [errors, setErrors] = useState<Partial<TransactionData>>({});

  // Validate Ethereum address
  const isValidAddress = (address: string): boolean => {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  };

  // Validate amount
  const isValidAmount = (amount: string, balance: string): boolean => {
    try {
      const amountNum = parseFloat(amount);
      const balanceNum = parseFloat(balance);
      return amountNum > 0 && amountNum <= balanceNum;
    } catch {
      return false;
    }
  };

  // Handle form validation
  const validateForm = (): boolean => {
    const newErrors: Partial<TransactionData> = {};

    if (!formData.to) {
      newErrors.to = "Recipient address is required";
    } else if (!isValidAddress(formData.to)) {
      newErrors.to = "Invalid Ethereum address";
    }

    if (!formData.amount) {
      newErrors.amount = "Amount is required";
    } else if (!isValidAmount(formData.amount, balance)) {
      newErrors.amount = "Invalid amount or insufficient balance";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSend(formData);
      // Reset form on successful send
      setFormData({ to: "", amount: "" });
      setErrors({});
      onClose();
    } catch (error) {
      // Error handling is done in parent component
      console.error("Send transaction failed:", error);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof TransactionData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Set max amount
  const handleMaxClick = () => {
    // Leave some ETH for gas fees (rough estimate)
    const maxAmount = Math.max(0, parseFloat(balance) - 0.001);
    handleInputChange("amount", maxAmount.toString());
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Send ETH</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="send-form">
          <div className="form-group">
            <label htmlFor="recipient">Recipient Address</label>
            <input
              id="recipient"
              type="text"
              placeholder="0x..."
              value={formData.to}
              onChange={(e) => handleInputChange("to", e.target.value)}
              className={errors.to ? "error" : ""}
              disabled={isLoading}
            />
            {errors.to && <div className="error-message">{errors.to}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount (ETH)</label>
            <div className="amount-input-group">
              <input
                id="amount"
                type="number"
                step="0.000000000000000001"
                min="0"
                placeholder="0.0"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                className={errors.amount ? "error" : ""}
                disabled={isLoading}
              />
              <button
                type="button"
                className="max-button"
                onClick={handleMaxClick}
                disabled={isLoading}
              >
                MAX
              </button>
            </div>
            {errors.amount && <div className="error-message">{errors.amount}</div>}
            <div className="balance-info">Available: {balance} ETH</div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="send-button"
              disabled={isLoading || !formData.to || !formData.amount}
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}