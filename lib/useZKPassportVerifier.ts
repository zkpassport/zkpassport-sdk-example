"use client";

import { useCallback, useState } from "react";
import { http } from "wagmi";
import { createPublicClient } from "viem";
import { sepolia } from "wagmi/chains";
import { ZKPASSPORT_VERIFIER_ABI } from "./wagmi";
import { ProofResult, ZKPassport } from "@zkpassport/sdk";
import { useNetworkContext } from "./NetworkContext";
import { anvil } from "./wagmi";

export function useZKPassportVerifier() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean | undefined>(undefined);
  const [verificationError, setVerificationError] = useState<string | undefined>(undefined);

  // Get the selected network from context
  const { selectedNetwork } = useNetworkContext();

  // Function to verify the proof by calling the view function
  const verifyProof = useCallback(
    async (proofResult: ProofResult) => {
      setIsVerifying(true);
      setVerificationResult(undefined);
      setVerificationError(undefined);
      const zkPassport = new ZKPassport(window.location.hostname);

      try {
        const params = zkPassport.getSolidityVerifierParameters(proofResult);
        const verifierDetails = zkPassport.getSolidityVerifierDetails("ethereum_sepolia");

        // Get the appropriate chain object based on network ID
        const chain = selectedNetwork.id === sepolia.id ? sepolia : anvil;

        // Create a public client for the selected network
        const publicClient = createPublicClient({
          chain,
          transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
        });

        // Use the public client to call the view function
        const result = await publicClient.readContract({
          address: verifierDetails.address as `0x${string}`,
          abi: ZKPASSPORT_VERIFIER_ABI,
          functionName: "verifyProof",
          args: [
            params.vkeyHash,
            params.proof,
            params.publicInputs,
            params.committedInputs,
            params.committedInputCounts,
            params.validityPeriodInDays,
          ],
        });

        // For view functions, the result is directly available
        const isVerified = Array.isArray(result) ? Boolean(result[0]) : false;
        const uniqueIdentifier = Array.isArray(result) ? String(result[1]) : "";
        setVerificationResult(isVerified);
        return { isVerified, uniqueIdentifier };
      } catch (error) {
        console.error("Error verifying proof:", error);
        setVerificationError(error instanceof Error ? error.message : "Unknown error");
        setVerificationResult(false);
        return { isVerified: false, uniqueIdentifier: "" };
      } finally {
        setIsVerifying(false);
      }
    },
    [selectedNetwork]
  );

  return {
    verifyProof,
    isVerifying,
    verificationResult,
    verificationError,
  };
}
