import { ethers, formatEther } from "ethers";
import type { TransactionData, TransactionResult } from "../types";

/**
 * Try to get ETH balance using a provider if available (window.ethereum).
 * Falls back to a placeholder string when no provider is present.
 */
export async function getEthBalance(address: string): Promise<string> {
  try {
    // Use window.ethereum if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyWin: any = typeof window !== "undefined" ? window : undefined;
    if (anyWin && anyWin.ethereum) {
      const provider = new ethers.BrowserProvider(anyWin.ethereum as any);
      const bal = await provider.getBalance(address);
      return formatEther(bal);
    }
  } catch (e) {
    // ignore and fall through to placeholder
  }

  // Return a deterministic placeholder derived from the address when offline
  try {
    const last = address.slice(-6);
    const n = parseInt(last.replace(/[^0-9]/g, "")) || 0;
    const val = (n % 10) + 0.123;
    return val.toFixed(6);
  } catch (e) {
    return "0.0";
  }
}

/**
 * Send ETH transaction using the connected wallet
 */
export async function sendTransaction(transactionData: TransactionData): Promise<TransactionResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyWin: any = typeof window !== "undefined" ? window : undefined;
    if (!anyWin || !anyWin.ethereum) {
      throw new Error("No wallet provider found");
    }

    const provider = new ethers.BrowserProvider(anyWin.ethereum);
    const signer = await provider.getSigner();

    // Prepare transaction
    const tx = {
      to: transactionData.to,
      value: ethers.parseEther(transactionData.amount),
      gasLimit: transactionData.gasLimit ? BigInt(transactionData.gasLimit) : undefined,
      gasPrice: transactionData.gasPrice ? BigInt(transactionData.gasPrice) : undefined,
    };

    // Send transaction
    const txResponse = await signer.sendTransaction(tx);
    
    return {
      hash: txResponse.hash,
      status: "pending",
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Transaction failed:", error);
    throw new Error(error instanceof Error ? error.message : "Transaction failed");
  }
}
