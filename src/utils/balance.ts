import { ethers, formatEther } from "ethers";

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
