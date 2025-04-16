import { sepolia } from "wagmi/chains";

// Define the local Anvil chain
export const anvil = {
  id: 31337,
  name: "Anvil",
  network: "anvil",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
} as const;

// Define available chains but don't create config here
// This avoids client-side code execution on server
export const chains = [sepolia, anvil];
export const transports = {
  [sepolia.id]: "https://rpc.sepolia.org",
  [anvil.id]: "http://127.0.0.1:8545",
};

// ZKPassport Verifier Contract ABI (simplified for the verifyProof function)
// Replace this with your actual contract ABI
export const ZKPASSPORT_VERIFIER_ABI = [
  { type: "constructor", inputs: [], stateMutability: "nonpayable" },
  {
    type: "function",
    name: "addVerifiers",
    inputs: [
      { name: "vkeyHashes", type: "bytes32[]", internalType: "bytes32[]" },
      { name: "verifiers", type: "address[]", internalType: "address[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "admin",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "paused",
    inputs: [],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "removeVerifiers",
    inputs: [{ name: "vkeyHashes", type: "bytes32[]", internalType: "bytes32[]" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setPaused",
    inputs: [{ name: "_paused", type: "bool", internalType: "bool" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferAdmin",
    inputs: [{ name: "newAdmin", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "verifyProof",
    inputs: [
      { name: "vkeyHash", type: "bytes32", internalType: "bytes32" },
      { name: "proof", type: "bytes", internalType: "bytes" },
      { name: "publicInputs", type: "bytes32[]", internalType: "bytes32[]" },
      { name: "committedInputs", type: "bytes", internalType: "bytes" },
      { name: "committedInputCounts", type: "uint256[]", internalType: "uint256[]" },
      { name: "validityPeriodInDays", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "", type: "bool", internalType: "bool" },
      { name: "", type: "bytes32", internalType: "bytes32" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vkeyHashToVerifier",
    inputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AdminUpdated",
    inputs: [
      { name: "oldAdmin", type: "address", indexed: true, internalType: "address" },
      { name: "newAdmin", type: "address", indexed: true, internalType: "address" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PausedStatusChanged",
    inputs: [{ name: "paused", type: "bool", indexed: false, internalType: "bool" }],
    anonymous: false,
  },
  {
    type: "event",
    name: "VerifierAdded",
    inputs: [
      { name: "vkeyHash", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "verifier", type: "address", indexed: true, internalType: "address" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "VerifierRemoved",
    inputs: [{ name: "vkeyHash", type: "bytes32", indexed: true, internalType: "bytes32" }],
    anonymous: false,
  },
  {
    type: "event",
    name: "ZKPassportVerifierDeployed",
    inputs: [
      { name: "admin", type: "address", indexed: true, internalType: "address" },
      { name: "timestamp", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
];

// Contract address based on selected network
export const ZKPASSPORT_VERIFIER_ADDRESS =
  process.env.NEXT_PUBLIC_LOCAL_VERIFIER_ADDRESS || "0x0000000000000000000000000000000000000000";
