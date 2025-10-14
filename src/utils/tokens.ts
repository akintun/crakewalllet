import { ethers } from "ethers";
import type { TokenInfo, TokenBalance } from "../types";

// ERC-20 ABI for balance and info functions
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)", 
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

// Common ERC-20 tokens on different networks
export const COMMON_TOKENS: Record<number, TokenInfo[]> = {
  // Ethereum Mainnet
  1: [
    {
      address: "0xA0b86a33E6441c8C72eae8C27F67d9a3c7AB4C18",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      balance: "0",
      logoUrl: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
    },
    {
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      name: "Tether USD",
      symbol: "USDT", 
      decimals: 6,
      balance: "0",
      logoUrl: "https://cryptologos.cc/logos/tether-usdt-logo.png"
    },
    {
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      name: "Dai Stablecoin",
      symbol: "DAI",
      decimals: 18,
      balance: "0",
      logoUrl: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png"
    }
  ],
  // Polygon
  137: [
    {
      address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      name: "USD Coin (PoS)",
      symbol: "USDC",
      decimals: 6,
      balance: "0",
      logoUrl: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
    },
    {
      address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      name: "Tether USD (PoS)",
      symbol: "USDT",
      decimals: 6,
      balance: "0",
      logoUrl: "https://cryptologos.cc/logos/tether-usdt-logo.png"
    }
  ]
};

/**
 * Get token balance for a specific address
 */
export async function getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyWin: any = typeof window !== "undefined" ? window : undefined;
    if (!anyWin || !anyWin.ethereum) {
      return "0";
    }

    const provider = new ethers.BrowserProvider(anyWin.ethereum);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    const balance = await contract.balanceOf(walletAddress);
    const decimals = await contract.decimals();
    
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error(`Failed to get token balance for ${tokenAddress}:`, error);
    return "0";
  }
}

/**
 * Get token information
 */
export async function getTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyWin: any = typeof window !== "undefined" ? window : undefined;
    if (!anyWin || !anyWin.ethereum) {
      return null;
    }

    const provider = new ethers.BrowserProvider(anyWin.ethereum);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(), 
      contract.decimals()
    ]);
    
    return {
      address: tokenAddress,
      name,
      symbol,
      decimals: Number(decimals),
      balance: "0"
    };
  } catch (error) {
    console.error(`Failed to get token info for ${tokenAddress}:`, error);
    return null;
  }
}

/**
 * Get all token balances for a wallet
 */
export async function getAllTokenBalances(walletAddress: string, chainId: number): Promise<TokenBalance[]> {
  const tokens = COMMON_TOKENS[chainId] || [];
  const tokenBalances: TokenBalance[] = [];
  
  for (const token of tokens) {
    try {
      const balance = await getTokenBalance(token.address, walletAddress);
      
      if (parseFloat(balance) > 0) {
        tokenBalances.push({
          token: { ...token, balance },
          balance,
          usdValue: "0.00" // Would need price API integration
        });
      }
    } catch (error) {
      console.error(`Failed to get balance for token ${token.symbol}:`, error);
    }
  }
  
  return tokenBalances;
}

/**
 * Send ERC-20 token
 */
export async function sendToken(
  tokenAddress: string, 
  to: string, 
  amount: string, 
  decimals: number
): Promise<{ hash: string; status: 'pending'; timestamp: number }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyWin: any = typeof window !== "undefined" ? window : undefined;
    if (!anyWin || !anyWin.ethereum) {
      throw new Error("No wallet provider found");
    }

    const provider = new ethers.BrowserProvider(anyWin.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    
    const parsedAmount = ethers.parseUnits(amount, decimals);
    const tx = await contract.transfer(to, parsedAmount);
    
    return {
      hash: tx.hash,
      status: "pending",
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Token transfer failed:", error);
    throw new Error(error instanceof Error ? error.message : "Token transfer failed");
  }
}

/**
 * Add custom token
 */
export async function addCustomToken(tokenAddress: string): Promise<TokenInfo | null> {
  try {
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error("Invalid token address");
    }
    
    const tokenInfo = await getTokenInfo(tokenAddress);
    if (!tokenInfo) {
      throw new Error("Failed to get token information");
    }
    
    return tokenInfo;
  } catch (error) {
    console.error("Failed to add custom token:", error);
    throw error;
  }
}

/**
 * Get current network chain ID
 */
export async function getChainId(): Promise<number> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyWin: any = typeof window !== "undefined" ? window : undefined;
    if (!anyWin || !anyWin.ethereum) {
      return 1; // Default to Ethereum mainnet
    }

    const provider = new ethers.BrowserProvider(anyWin.ethereum);
    const network = await provider.getNetwork();
    return Number(network.chainId);
  } catch (error) {
    console.error("Failed to get chain ID:", error);
    return 1;
  }
}