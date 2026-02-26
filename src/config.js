import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { mainnet, sepolia, solanaDevnet } from "@reown/appkit/networks";

export const projectId = import.meta.env.VITE_PROJECT_ID;

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [mainnet, sepolia],
  ssr: false
});

export const solanaAdapter = new SolanaAdapter({
  networks: [solanaDevnet]
});

export const appKit = createAppKit({
  projectId,
  adapters: [wagmiAdapter, solanaAdapter],
  networks: [mainnet, sepolia, solanaDevnet],
  metadata: {
    name: "Multichain DApp",
    description: "EVM + Solana AppKit DApp",
    url: window.location.origin,
    icons: []
  }
});
