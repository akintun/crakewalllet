import { useState } from "react";
import { ethers } from "ethers";
import AddressBookModal from "./AddressBook";
import GasFeeEstimator from "./GasFeeEstimator";
// 1. Import the confirmation component
import TransactionConfirmation from "./TransactionConfirmation"; 
import type { SendModalProps, TransactionData } from "../types";

export default function SendModal({ 
  isOpen, 
  onClose, 
  onSend, 
  balance, 
  isLoading,
  provider 
}: SendModalProps) {
  const [formData, setFormData] = useState<TransactionData>({
    to: "",
    amount: "",
  });
  const [errors, setErrors] = useState<Partial<TransactionData>>({});
  const [showAddressBook, setShowAddressBook] = useState(false);
  
  // 2. New state for confirmation modal
  const [showConfirmation, setShowConfirmation] = useState(false); 
  
  // 3. Update gas state to include estimated cost for display in confirmation
  const [gasDetails, setGasDetails] = useState({
    gasLimit: "",
    gasPrice: "",
    estimatedCostETH: "", // Store ETH cost for display
  });

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
      // Check for zero amount, or if amount + estimated gas > balance
      // Note: Full gas check requires knowing the final gas cost. Using a rough 0.001 ETH buffer for now.
      const totalEstimatedCost = parseFloat(formData.amount || "0") + parseFloat(gasDetails.estimatedCostETH || "0");
      return amountNum > 0 && totalEstimatedCost <= balanceNum;
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
      newErrors.amount = "Invalid amount or insufficient balance (check gas cost)";
    }
    
    // Check if gas is estimated before proceeding to confirmation
    if (!gasDetails.gasLimit || !gasDetails.gasPrice) {
        newErrors.gas = "Gas estimation failed or is in progress.";
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 4. Update handleSubmit to show confirmation instead of sending immediately
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Pass gas details to formData before showing confirmation
    setFormData(prev => ({ 
        ...prev, 
        gasLimit: gasDetails.gasLimit,
        gasPrice: gasDetails.gasPrice,
    }));
    
    setShowConfirmation(true);
  };
  
  // 5. New function to handle final send from confirmation modal
  const handleConfirmSend = async () => {
    try {
      // The onSend prop already handles the loading and error state in App.tsx
      await onSend({
        ...formData,
        gasLimit: gasDetails.gasLimit,
        gasPrice: gasDetails.gasPrice,
      });
      // Reset form and close both modals on successful send
      setFormData({ to: "", amount: "" });
      setGasDetails({ gasLimit: "", gasPrice: "", estimatedCostETH: "" });
      setShowConfirmation(false);
      onClose();
    } catch (error) {
      // Re-throw to let App.tsx handle the error banner display
      console.error("Confirmation send failed:", error);
      setShowConfirmation(false); // Close confirmation on failure
    }
  }

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
    const gasBuffer = parseFloat(gasDetails.estimatedCostETH || '0.001');
    const maxAmount = Math.max(0, parseFloat(balance) - gasBuffer);
    handleInputChange("amount", maxAmount.toString());
  };

  // Handle address selection from address book
  const handleSelectAddress = (address: string) => {
    handleInputChange("to", address);
    setShowAddressBook(false);
  };

  // 6. Update handleGasUpdate to store all gas details
  const handleGasUpdate = (newGasLimit: string, newGasPrice: string, newEstimatedCostETH: string) => {
    setGasDetails({
      gasLimit: newGasLimit,
      gasPrice: newGasPrice,
      estimatedCostETH: newEstimatedCostETH,
    });
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
          {/* ... Recipient Address Form Group ... */}
          <div className="form-group">
            <label htmlFor="recipient">Recipient Address</label>
            <div className="address-input-group">
              <input
                id="recipient"
                type="text"
                placeholder="0x..."
                value={formData.to}
                onChange={(e) => handleInputChange("to", e.target.value)}
                className={errors.to ? "error" : ""}
                disabled={isLoading}
              />
              <button
                type="button"
                className="address-book-button"
                onClick={() => setShowAddressBook(true)}
                disabled={isLoading}
                title="Select from address book"
              >
                📇
              </button>
            </div>
            {errors.to && <div className="error-message">{errors.to}</div>}
          </div>

          {/* ... Amount Form Group ... */}
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

          {formData.to && formData.amount && provider && (
            <GasFeeEstimator
              provider={provider}
              to={formData.to}
              value={formData.amount}
              // 7. Pass a function to handle full gas update
              onGasUpdate={(gasLimit, gasPrice, estimatedCostETH) => 
                handleGasUpdate(gasLimit, gasPrice, estimatedCostETH)
              }
            />
          )}
          {errors.gas && <div className="error-message">{errors.gas}</div>}


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
              disabled={isLoading || !formData.to || !formData.amount || !gasDetails.gasLimit}
            >
              {isLoading ? "Sending..." : "Review & Send"}
            </button>
          </div>
        </form>
      </div>
      
      {showAddressBook && (
        <AddressBookModal
          isOpen={showAddressBook}
          onClose={() => setShowAddressBook(false)}
          onSelectAddress={handleSelectAddress}
        />
      )}
      
      {/* 8. Transaction Confirmation Modal */}
      <TransactionConfirmation
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmSend}
        transaction={{
          to: formData.to,
          amount: formData.amount,
          gasLimit: gasDetails.gasLimit,
          gasPrice: gasDetails.gasPrice,
        }}
        estimatedCost={gasDetails.estimatedCostETH}
        isLoading={isLoading}
      />
    </div>
  );
}
