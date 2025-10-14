import { useState, useEffect } from "react";
import QRCode from "qrcode";
import type { ReceiveModalProps } from "../types";

export default function ReceiveModal({ isOpen, onClose, address }: ReceiveModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && address) {
      QRCode.toDataURL(address, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
        .then(setQrCodeDataUrl)
        .catch(console.error);
    }
  }, [isOpen, address]);

  // Copy address to clipboard
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Format address for display
  const formatAddress = (addr: string): string => {
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Receive ETH</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="receive-content">
          <div className="qr-section">
            <p>Scan QR code or copy address below to receive ETH</p>
            
            {qrCodeDataUrl ? (
              <div className="qr-code-container">
                <img src={qrCodeDataUrl} alt="Wallet Address QR Code" />
              </div>
            ) : (
              <div className="qr-placeholder">
                <div className="loading-spinner">Generating QR Code...</div>
              </div>
            )}
          </div>

          <div className="address-section">
            <label>Your Wallet Address</label>
            <div className="address-display">
              <div className="address-text" title={address}>
                {formatAddress(address)}
              </div>
              <button
                className={`copy-button ${copied ? "copied" : ""}`}
                onClick={handleCopyAddress}
                title="Copy full address"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            
            <div className="full-address">
              <small>{address}</small>
            </div>
          </div>

          <div className="warning-section">
            <div className="warning-box">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>Only send ETH and ERC-20 tokens to this address</li>
                <li>Make sure the network matches (Ethereum, Polygon, etc.)</li>
                <li>Sending tokens from wrong networks may result in permanent loss</li>
              </ul>
            </div>
          </div>

          <div className="modal-actions">
            <button className="close-modal-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}