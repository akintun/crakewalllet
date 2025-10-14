import { useState, useEffect } from "react";
import { useAppKitState } from "@reown/appkit/react";

interface NetworkInfo {
  chainId: number;
  name: string;
  symbol: string;
  logo: string;
  isTestnet: boolean;
}

const SUPPORTED_NETWORKS: NetworkInfo[] = [
  {
    chainId: 1,
    name: "Ethereum",
    symbol: "ETH",
    logo: "🔷",
    isTestnet: false
  },
  {
    chainId: 137,
    name: "Polygon",
    symbol: "MATIC", 
    logo: "🔮",
    isTestnet: false
  },
  {
    chainId: 8453,
    name: "Base",
    symbol: "ETH",
    logo: "🔵",
    isTestnet: false
  },
  {
    chainId: 42161,
    name: "Arbitrum",
    symbol: "ETH",
    logo: "🔴",
    isTestnet: false
  },
  {
    chainId: 10,
    name: "Optimism", 
    symbol: "ETH",
    logo: "🔴",
    isTestnet: false
  }
];

interface NetworkSwitcherProps {
  isConnected: boolean;
}

export default function NetworkSwitcher({ isConnected }: NetworkSwitcherProps) {
  const appKitState = useAppKitState();
  const [isOpen, setIsOpen] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState<NetworkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (appKitState.activeChain) {
      // Extract chain ID from the activeChain object
      const chainId = parseInt(appKitState.activeChain.toString()) || 1;
      const network = SUPPORTED_NETWORKS.find(n => n.chainId === chainId);
      setCurrentNetwork(network || null);
    } else {
      setCurrentNetwork(null);
    }
  }, [appKitState.activeChain]);

  const switchNetwork = async (network: NetworkInfo) => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      // Use window.ethereum directly for network switching
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const chainIdHex = `0x${network.chainId.toString(16)}`;
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
      }
      setIsOpen(false);
    } catch (error: any) {
      console.error("Failed to switch network:", error);
      
      // If the chain hasn't been added to MetaMask, add it
      if (error?.code === 4902) {
        try {
          await addNetwork(network);
        } catch (addError) {
          console.error("Failed to add network:", addError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addNetwork = async (network: NetworkInfo) => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;

    const networkConfig = getNetworkConfig(network);
    await (window as any).ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [networkConfig],
    });
  };

  const getNetworkConfig = (network: NetworkInfo) => {
    const chainIdHex = `0x${network.chainId.toString(16)}`;
    
    const configs: Record<number, any> = {
      137: {
        chainId: chainIdHex,
        chainName: 'Polygon',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://polygon-rpc.com/'],
        blockExplorerUrls: ['https://polygonscan.com/']
      },
      8453: {
        chainId: chainIdHex,
        chainName: 'Base',
        nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.base.org/'],
        blockExplorerUrls: ['https://basescan.org/']
      },
      42161: {
        chainId: chainIdHex,
        chainName: 'Arbitrum One',
        nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://arb1.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://arbiscan.io/']
      },
      10: {
        chainId: chainIdHex,
        chainName: 'Optimism',
        nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.optimism.io/'],
        blockExplorerUrls: ['https://optimistic.etherscan.io/']
      }
    };

    return configs[network.chainId] || {
      chainId: chainIdHex,
      chainName: network.name,
      nativeCurrency: { name: network.symbol, symbol: network.symbol, decimals: 18 },
      rpcUrls: [''],
      blockExplorerUrls: ['']
    };
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="network-switcher">
      <button 
        className="network-selector"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        {currentNetwork ? (
          <>
            <span className="network-logo">{currentNetwork.logo}</span>
            <span className="network-name">{currentNetwork.name}</span>
            <span className="dropdown-arrow">▼</span>
          </>
        ) : (
          <>
            <span className="network-logo">❓</span>
            <span className="network-name">Unknown Network</span>
            <span className="dropdown-arrow">▼</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="network-dropdown">
          <div className="network-dropdown-header">
            <h4>Select Network</h4>
            <button 
              className="close-dropdown"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>
          
          <div className="network-list">
            {SUPPORTED_NETWORKS.map((network) => (
              <button
                key={network.chainId}
                className={`network-option ${
                  currentNetwork?.chainId === network.chainId ? 'active' : ''
                }`}
                onClick={() => switchNetwork(network)}
                disabled={isLoading}
              >
                <div className="network-option-main">
                  <span className="network-logo">{network.logo}</span>
                  <div className="network-details">
                    <span className="network-name">{network.name}</span>
                    <span className="network-symbol">{network.symbol}</span>
                  </div>
                </div>
                
                {currentNetwork?.chainId === network.chainId && (
                  <span className="active-indicator">✅</span>
                )}
              </button>
            ))}
          </div>
          
          <div className="network-dropdown-footer">
            <p className="network-warning">
              ⚠️ Make sure to switch to the correct network for your tokens
            </p>
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="network-dropdown-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}