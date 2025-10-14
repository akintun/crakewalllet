import { createAppKit } from "@reown/appkit";
import {
  mainnet,
  polygon,
  base,
  solana,
  arbitrum,
  optimism,
} from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";

// Get projectId with better environment handling
const getProjectId = (): string => {
  // Try to get from environment first
  const envProjectId = (import.meta as any).env?.VITE_PROJECT_ID;
  if (envProjectId) {
    return envProjectId;
  }
  
  // Fallback to hardcoded for development
  console.warn("VITE_PROJECT_ID not found in environment, using fallback. Please set up .env file.");
  return "6308c8b3d501cebc4047d5c6c8b06206";
};

export const projectId = getProjectId();

// Define networks
export const networks = [
  mainnet,
  polygon,
  base,
  solana,
  arbitrum,
  optimism,
] as [AppKitNetwork, ...AppKitNetwork[]];

// Create AppKit instance with embedded wallet
export const appKit = createAppKit({
  projectId,
  networks,
  metadata: {
    name: "CrakeWallet",
    description: "A modern crypto wallet application",
    url: (import.meta as any).env?.DEV ? "http://localhost:5173" : "https://crakewallet.com",
    icons: ["https://crakewallet.com/icon.png"],
  },
  features: {
    analytics: true,
    email: false,
    socials: false,
    emailShowWallets: false,
  },
});