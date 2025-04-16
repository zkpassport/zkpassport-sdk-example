"use client";

import { useNetworkContext } from "../lib/NetworkContext";

export default function NetworkInfo() {
  const { selectedNetwork, setSelectedNetwork, networks } = useNetworkContext();

  return (
    <div className="p-3 bg-gray-100 rounded-md my-2 text-sm w-full max-w-md">
      <div className="flex justify-between items-center mb-2">
        <p className="font-medium">
          Network: <span className={selectedNetwork.color}>{selectedNetwork.name}</span>
        </p>

        <div className="relative">
          <select
            className="px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedNetwork.id}
            onChange={(e) => {
              const networkId = parseInt(e.target.value);
              const network = networks.find((n) => n.id === networkId);
              if (network) {
                setSelectedNetwork(network);
              }
            }}
          >
            {networks.map((network) => (
              <option key={network.id} value={network.id}>
                {network.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-xs mt-2 text-gray-600">
        <p>Chain ID: {selectedNetwork.id}</p>
        <p className="truncate">RPC URL: {selectedNetwork.rpcUrl}</p>
        <p className="truncate">Contract: {selectedNetwork.contractAddress}</p>
      </div>
    </div>
  );
}
