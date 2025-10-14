import { ethers } from "ethers";
import type { TransactionHistory } from "../types";

// Local storage key for transaction history
const TRANSACTION_HISTORY_KEY = 'crakewallet_transaction_history';

/**
 * Save transaction to local storage
 */
export function saveTransaction(transaction: TransactionHistory): void {
  try {
    const stored = localStorage.getItem(TRANSACTION_HISTORY_KEY);
    const history: TransactionHistory[] = stored ? JSON.parse(stored) : [];
    
    // Avoid duplicates
    const exists = history.find(tx => tx.hash === transaction.hash);
    if (!exists) {
      history.unshift(transaction); // Add to beginning
      
      // Keep only last 100 transactions
      if (history.length > 100) {
        history.splice(100);
      }
      
      localStorage.setItem(TRANSACTION_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Failed to save transaction:', error);
  }
}

/**
 * Get transaction history from local storage
 */
export function getTransactionHistory(address?: string): TransactionHistory[] {
  try {
    const stored = localStorage.getItem(TRANSACTION_HISTORY_KEY);
    const history: TransactionHistory[] = stored ? JSON.parse(stored) : [];
    
    // Filter by address if provided
    if (address) {
      return history.filter(tx => 
        tx.from.toLowerCase() === address.toLowerCase() || 
        tx.to.toLowerCase() === address.toLowerCase()
      );
    }
    
    return history;
  } catch (error) {
    console.error('Failed to get transaction history:', error);
    return [];
  }
}

/**
 * Update transaction status
 */
export function updateTransactionStatus(hash: string, status: TransactionHistory['status']): void {
  try {
    const stored = localStorage.getItem(TRANSACTION_HISTORY_KEY);
    const history: TransactionHistory[] = stored ? JSON.parse(stored) : [];
    
    const txIndex = history.findIndex(tx => tx.hash === hash);
    if (txIndex !== -1) {
      history[txIndex].status = status;
      localStorage.setItem(TRANSACTION_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Failed to update transaction status:', error);
  }
}

/**
 * Clear transaction history
 */
export function clearTransactionHistory(): void {
  try {
    localStorage.removeItem(TRANSACTION_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear transaction history:', error);
  }
}

/**
 * Fetch transaction details from blockchain
 */
export async function fetchTransactionDetails(hash: string): Promise<Partial<TransactionHistory> | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyWin: any = typeof window !== "undefined" ? window : undefined;
    if (!anyWin || !anyWin.ethereum) {
      return null;
    }

    const provider = new ethers.BrowserProvider(anyWin.ethereum);
    const tx = await provider.getTransaction(hash);
    const receipt = await provider.getTransactionReceipt(hash);
    
    if (!tx) return null;
    
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to || '',
      amount: ethers.formatEther(tx.value),
      status: receipt ? (receipt.status === 1 ? 'confirmed' : 'failed') : 'pending',
      blockNumber: tx.blockNumber || undefined,
      gasUsed: receipt ? receipt.gasUsed.toString() : undefined,
      gasPrice: tx.gasPrice ? tx.gasPrice.toString() : undefined,
    };
  } catch (error) {
    console.error('Failed to fetch transaction details:', error);
    return null;
  }
}

/**
 * Monitor pending transactions and update their status
 */
export async function monitorPendingTransactions(): Promise<void> {
  try {
    const history = getTransactionHistory();
    const pendingTxs = history.filter(tx => tx.status === 'pending');
    
    for (const tx of pendingTxs) {
      const details = await fetchTransactionDetails(tx.hash);
      if (details && details.status !== 'pending') {
        updateTransactionStatus(tx.hash, details.status!);
      }
    }
  } catch (error) {
    console.error('Failed to monitor pending transactions:', error);
  }
}