"use client";

import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { anvil, transports } from "../lib/wagmi";
import { NetworkProvider } from "../lib/NetworkContext";
import { createStorage } from "wagmi";

// Create the wagmi config directly in this client component
const clientConfig = createConfig({
  chains: [sepolia, anvil],
  transports: {
    [sepolia.id]: http(transports[sepolia.id]),
    [anvil.id]: http(transports[anvil.id]),
  },
  storage: createStorage({
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  }),
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={clientConfig}>
      <NetworkProvider>{children}</NetworkProvider>
    </WagmiProvider>
  );
}
