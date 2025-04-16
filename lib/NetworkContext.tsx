"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { anvil } from "./wagmi";
import { sepolia } from "wagmi/chains";

// Define the available networks
export const networks = [
  {
    id: sepolia.id,
    name: "Sepolia Testnet",
    rpcUrl: "https://rpc.sepolia.org",
    contractAddress:
      process.env.NEXT_PUBLIC_SEPOLIA_VERIFIER_ADDRESS ||
      "0x0000000000000000000000000000000000000000",
    color: "text-blue-600",
  },
  {
    id: anvil.id,
    name: "Local Anvil",
    rpcUrl: "http://127.0.0.1:8545",
    contractAddress:
      process.env.NEXT_PUBLIC_LOCAL_VERIFIER_ADDRESS ||
      "0x0000000000000000000000000000000000000000",
    color: "text-purple-600",
  },
];

// Define context type
type NetworkContextType = {
  selectedNetwork: (typeof networks)[0];
  setSelectedNetwork: (network: (typeof networks)[0]) => void;
  networks: typeof networks;
};

// Create the context with default value
const NetworkContext = createContext<NetworkContextType>({
  selectedNetwork: networks[0],
  setSelectedNetwork: () => {},
  networks,
});

// Provider component
export function NetworkProvider({ children }: { children: ReactNode }) {
  // Default to Sepolia unless previously selected
  const [selectedNetwork, setSelectedNetwork] = useState<(typeof networks)[0]>(networks[0]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load the saved network preference
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedNetworkId = localStorage.getItem("selectedNetworkId");
        if (savedNetworkId) {
          const networkId = parseInt(savedNetworkId);
          const network = networks.find((n) => n.id === networkId);
          if (network) {
            setSelectedNetwork(network);
          }
        }
      }
    } catch (error) {
      console.error("Error loading network preference:", error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save the network preference
  const handleSetSelectedNetwork = (network: (typeof networks)[0]) => {
    setSelectedNetwork(network);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedNetworkId", network.id.toString());
      }
    } catch (error) {
      console.error("Error saving network preference:", error);
    }
  };

  // Don't render children until we've attempted to load from localStorage
  if (!isInitialized && typeof window !== "undefined") {
    return <div>Loading network settings...</div>;
  }

  return (
    <NetworkContext.Provider
      value={{
        selectedNetwork,
        setSelectedNetwork: handleSetSelectedNetwork,
        networks,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

// Hook for using the context
export function useNetworkContext() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetworkContext must be used within a NetworkProvider");
  }
  return context;
}
