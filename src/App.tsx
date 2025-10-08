import { useState, useEffect } from "react";
import { appKit } from "./config";
import { useAppKit, useAppKitState } from "@reown/appkit/react";
import "./App.css";
import Integrations from "./integrations/Integrations";
import { getEthBalance } from "./utils/balance";

function App() {
  const { open } = useAppKit();
  const appKitState = useAppKitState();
  const [balance, setBalance] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = !!appKitState.activeChain;
  const address = isConnected ? appKit.getAddress() : "";

  // Update balance when connected
  useEffect(() => {
    let mounted = true;
    async function fetchBalance() {
      if (isConnected && address) {
        try {
          const b = await getEthBalance(address);
          if (mounted) setBalance(b);
        } catch (e) {
          console.warn("Balance fetch failed", e);
          if (mounted) setBalance("0.0");
        }
      } else {
        setBalance("");
      }
    }
    fetchBalance();
    return () => {
      mounted = false;
    };
  }, [isConnected, address]);

  // Connect to wallet (opens modal with embedded wallet option)
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await open();
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const handleDisconnect = async () => {
    try {
      await appKit.disconnect();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>InvestreWallet</h1>
        <p>A modern crypto wallet application</p>
      </header>

      <main className="app-main">
        {!isConnected ? (
          <div className="connect-section">
            <h2>Connect Your Wallet</h2>
            <p>
              Connect to your favorite wallet or create a new embedded wallet to
              start managing your crypto assets securely.
            </p>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="connect-button"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        ) : (
          <div className="wallet-section">
            <h2>Wallet Connected</h2>
            <div className="wallet-info">
              <p>
                <strong>Address:</strong> {address}
              </p>
              <p>
                <strong>Balance:</strong> {balance} ETH
              </p>
            </div>
            <div className="action-buttons">
              <button
                onClick={() => {
                  /* TODO: Send */
                }}
                className="send-button"
              >
                Send
              </button>
              <button
                onClick={() => {
                  /* TODO: Receive */
                }}
                className="receive-button"
              >
                Receive
              </button>
              <button onClick={handleDisconnect} className="disconnect-button">
                Disconnect
              </button>
            </div>
          </div>
        )}
        <Integrations />
      </main>
    </div>
  );
}

export default App;