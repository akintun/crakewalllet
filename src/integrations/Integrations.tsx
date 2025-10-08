import React from "react";
import { useQuery } from "@tanstack/react-query";
import MiniAppSDK from "@farcaster/miniapp-sdk";
import "@farcaster/miniapp-wagmi-connector";
import createClient from "@walletconnect/client";
import * as WCcore from "@walletconnect/core";
import * as WCtypes from "@walletconnect/types";
import * as WCutils from "@walletconnect/utils";
import { ethers } from "ethers";
import * as AppkitAdapterWagmi from "@reown/appkit-adapter-wagmi";
import * as AppkitCommon from "@reown/appkit-common";
import * as AppkitUniversal from "@reown/appkit-universal-connector";
import * as Walletkit from "@reown/walletkit";
import * as Viem from "viem";
import * as Wagmi from "wagmi";
import { useAppKit } from "@reown/appkit/react";

// A small integrations component that references several project dependencies.
export default function Integrations() {
  const { open } = useAppKit();

  // Example: lightweight walletconnect client creation (no network calls)
  const wcClient = React.useMemo(() => {
    try {
      // createClient may be a callable or a constructor depending on package version
      // use any cast to avoid TypeScript overload issues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const C: any = createClient;
      return typeof C === "function" ? new C({}) : null;
    } catch (e) {
      return null;
    }
  }, []);

  // Example: instantiate a Farcaster MiniApp SDK in-memory (no network ops)
  const mini = React.useMemo(() => {
    try {
      // MiniAppSDK may export a factory or class - handle both
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const M: any = MiniAppSDK;
      return typeof M === "function" ? (M.length ? new M({}) : M({})) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const info = useQuery({
    queryKey: [
      "integrations-info",
      wcClient ? "wc-ready" : "wc-missing",
      mini ? "mini-ready" : "mini-missing",
    ],
    queryFn: async () => {
      // return a small summary using ethers utilities
      return {
        ethersVersion: (ethers as any)?.version ?? "unknown",
        hasWalletConnect: !!wcClient,
        hasMiniApp: !!mini,
        appKitOpenAvailable: typeof open === "function",
        hasFarcasterWagmiConnector: !!(typeof window !== "undefined" && (window as any).FARCASTER !== undefined) || true,
        hasAppkitAdapterWagmi: !!AppkitAdapterWagmi,
        hasAppkitCommon: !!AppkitCommon,
        hasAppkitUniversalConnector: !!AppkitUniversal,
        hasReownWalletkit: !!Walletkit,
        hasWalletConnectCore: !!WCcore,
        hasWalletConnectTypes: !!WCtypes,
        hasWalletConnectUtils: !!WCutils,
        hasViem: !!Viem,
        hasWagmi: !!Wagmi,
      };
    },
  });

  return (
    <section style={{ marginTop: 24 }}>
      <h3>Integrations</h3>
      <p>This component references installed dependencies for demos and tests.</p>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {info.data ? JSON.stringify(info.data, null, 2) : info.isFetching ? "Loading..." : "Unavailable"}
      </pre>
    </section>
  );
}
