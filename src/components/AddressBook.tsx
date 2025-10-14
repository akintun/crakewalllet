import { useState, useEffect } from "react";
import { ethers } from "ethers";
import type { AddressBookEntry } from "../types";

interface AddressBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress?: (address: string) => void;
}

const ADDRESS_BOOK_KEY = 'crakewallet_address_book';

export default function AddressBookModal({ isOpen, onClose, onSelectAddress }: AddressBookModalProps) {
  const [addresses, setAddresses] = useState<AddressBookEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    address: '',
    note: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      loadAddresses();
    }
  }, [isOpen]);

  const loadAddresses = () => {
    try {
      const stored = localStorage.getItem(ADDRESS_BOOK_KEY);
      const addressBook: AddressBookEntry[] = stored ? JSON.parse(stored) : [];
      setAddresses(addressBook.sort((a, b) => b.lastUsed || 0 - (a.lastUsed || 0)));
    } catch (error) {
      console.error('Failed to load address book:', error);
      setAddresses([]);
    }
  };

  const saveAddresses = (addressBook: AddressBookEntry[]) => {
    try {
      localStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(addressBook));
      setAddresses(addressBook);
    } catch (error) {
      console.error('Failed to save address book:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!newAddress.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!newAddress.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (!ethers.isAddress(newAddress.address.trim())) {
      newErrors.address = 'Invalid Ethereum address';
    }

    // Check for duplicate address
    const existingAddress = addresses.find(
      addr => addr.address.toLowerCase() === newAddress.address.trim().toLowerCase()
    );
    if (existingAddress) {
      newErrors.address = 'Address already exists in address book';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAddress = () => {
    if (!validateForm()) return;

    const entry: AddressBookEntry = {
      id: Date.now().toString(),
      name: newAddress.name.trim(),
      address: newAddress.address.trim(),
      note: newAddress.note.trim(),
      createdAt: Date.now()
    };

    const updatedAddresses = [entry, ...addresses];
    saveAddresses(updatedAddresses);
    
    setNewAddress({ name: '', address: '', note: '' });
    setShowAddForm(false);
    setErrors({});
  };

  const handleSelectAddress = (address: string) => {
    // Update last used timestamp
    const updatedAddresses = addresses.map(addr => 
      addr.address === address 
        ? { ...addr, lastUsed: Date.now() }
        : addr
    );
    saveAddresses(updatedAddresses);

    if (onSelectAddress) {
      onSelectAddress(address);
    }
    onClose();
  };

  const handleDeleteAddress = (id: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      const updatedAddresses = addresses.filter(addr => addr.id !== id);
      saveAddresses(updatedAddresses);
    }
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content address-book-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Address Book</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="address-book-content">
          {!showAddForm ? (
            <>
              <div className="address-book-header">
                <button 
                  className="add-address-button"
                  onClick={() => setShowAddForm(true)}
                >
                  + Add New Address
                </button>
              </div>

              <div className="address-list">
                {addresses.length === 0 ? (
                  <div className="empty-address-book">
                    <div className="empty-icon">📇</div>
                    <h4>No saved addresses</h4>
                    <p>Add frequently used addresses for quick access</p>
                  </div>
                ) : (
                  addresses.map((entry) => (
                    <div key={entry.id} className="address-item">
                      <div className="address-main" onClick={() => handleSelectAddress(entry.address)}>
                        <div className="address-info">
                          <div className="address-name">{entry.name}</div>
                          <div className="address-value" title={entry.address}>
                            {formatAddress(entry.address)}
                          </div>
                          {entry.note && (
                            <div className="address-note">{entry.note}</div>
                          )}
                          <div className="address-meta">
                            Added: {formatDate(entry.createdAt)}
                            {entry.lastUsed && (
                              <span> • Last used: {formatDate(entry.lastUsed)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="address-actions">
                        <button 
                          className="delete-address-button"
                          onClick={() => handleDeleteAddress(entry.id)}
                          title="Delete address"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="add-address-form">
              <div className="add-address-header">
                <h4>Add New Address</h4>
                <button 
                  className="cancel-add-button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewAddress({ name: '', address: '', note: '' });
                    setErrors({});
                  }}
                >
                  Cancel
                </button>
              </div>

              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  placeholder="e.g., John's Wallet"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, name: e.target.value }))}
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <div className="error-message">{errors.name}</div>}
              </div>

              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={newAddress.address}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, address: e.target.value }))}
                  className={errors.address ? 'error' : ''}
                />
                {errors.address && <div className="error-message">{errors.address}</div>}
              </div>

              <div className="form-group">
                <label>Note (optional)</label>
                <input
                  type="text"
                  placeholder="Optional note about this address"
                  value={newAddress.note}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, note: e.target.value }))}
                />
              </div>

              <div className="form-actions">
                <button 
                  className="save-address-button"
                  onClick={handleAddAddress}
                >
                  Save Address
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}