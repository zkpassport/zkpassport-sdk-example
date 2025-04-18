"use client";
import { useEffect, useRef, useState } from "react";
import { ZKPassport, ProofResult } from "@zkpassport/sdk";
import QRCode from "react-qr-code";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

export default function Home() {
  const [message, setMessage] = useState("");
  const [isOver18, setIsOver18] = useState<boolean | undefined>(undefined);
  const [queryUrl, setQueryUrl] = useState("");
  const [uniqueIdentifier, setUniqueIdentifier] = useState("");
  const [verified, setVerified] = useState<boolean | undefined>(undefined);
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [onChainVerified, setOnChainVerified] = useState<boolean | undefined>(undefined);
  const zkPassportRef = useRef<ZKPassport | null>(null);

  useEffect(() => {
    if (!zkPassportRef.current) {
      zkPassportRef.current = new ZKPassport(window.location.hostname);
    }
  }, []);

  const createRequest = async () => {
    if (!zkPassportRef.current) {
      return;
    }
    setMessage("");
    setQueryUrl("");
    setIsOver18(undefined);
    setUniqueIdentifier("");
    setVerified(undefined);
    setOnChainVerified(undefined);

    const queryBuilder = await zkPassportRef.current.request({
      name: "ZKPassport",
      logo: "https://zkpassport.id/favicon.png",
      purpose: "Proof of adulthood",
      scope: "adult",
      mode: "compressed-evm",
    });

    const {
      url,
      onRequestReceived,
      onGeneratingProof,
      onProofGenerated,
      onResult,
      onReject,
      onError,
    } = queryBuilder.gte("age", 18).done();

    setQueryUrl(url);
    console.log(url);

    setRequestInProgress(true);

    onRequestReceived(() => {
      console.log("QR code scanned");
      setMessage("Request received");
    });

    onGeneratingProof(() => {
      console.log("Generating proof");
      setMessage("Generating proof...");
    });

    const proofs: ProofResult[] = [];

    onProofGenerated(async (result: ProofResult) => {
      console.log("Proof result", result);
      proofs.push(result);
      setMessage(`Proofs received`);
      setRequestInProgress(false);

      if (!zkPassportRef.current) {
        return;
      }

      try {
        // Perform on-chain verification
        const params = zkPassportRef.current.getSolidityVerifierParameters(result);
        const verifierDetails =
          zkPassportRef.current.getSolidityVerifierDetails("ethereum_sepolia");

        // Create a public client for the selected network
        const publicClient = createPublicClient({
          chain: sepolia,
          transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
        });

        // Use the public client to call the view function
        const contractCallResult = await publicClient.readContract({
          address: verifierDetails.address as `0x${string}`,
          abi: verifierDetails.abi,
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

        console.log("Contract call result", contractCallResult);
        const isVerified = Array.isArray(contractCallResult)
          ? Boolean(contractCallResult[0])
          : false;
        const uniqueIdentifier = Array.isArray(contractCallResult)
          ? String(contractCallResult[1])
          : "";
        setOnChainVerified(isVerified);
      } catch (error) {
        console.error("Error preparing verification:", error);
      }
    });

    onResult(async ({ result, uniqueIdentifier, verified, queryResultErrors }) => {
      console.log("Result of the query", result);
      console.log("Query result errors", queryResultErrors);
      setIsOver18(result?.age?.gte?.result);
      setMessage("Result received");
      setUniqueIdentifier(uniqueIdentifier || "");
      setVerified(verified);
      setRequestInProgress(false);

      /*const res = await fetch("/api/register", {
        method: "POST",
        body: JSON.stringify({
          queryResult: result,
          proofs,
        }),
      });

      console.log("Response from the server", await res.json());*/
    });

    onReject(() => {
      console.log("User rejected");
      setMessage("User rejected the request");
      setRequestInProgress(false);
    });

    onError((error: unknown) => {
      console.error("Error", error);
      setMessage("An error occurred");
      setRequestInProgress(false);
    });
  };

  return (
    <main className="w-full h-full flex flex-col items-center p-10">
      {queryUrl && <QRCode className="mb-4" value={queryUrl} />}
      {message && <p>{message}</p>}
      {typeof isOver18 === "boolean" && (
        <p className="mt-2">
          <b>Is over 18:</b> {isOver18 ? "Yes" : "No"}
        </p>
      )}
      {uniqueIdentifier && (
        <p className="mt-2">
          <b>Unique identifier:</b>
        </p>
      )}
      {uniqueIdentifier && <p>{uniqueIdentifier}</p>}
      {verified !== undefined && (
        <p className="mt-2">
          <b>Verified:</b> {verified ? "Yes" : "No"}
        </p>
      )}
      {onChainVerified !== undefined && (
        <p className="mt-2">
          <b>On-chain verified:</b> {onChainVerified ? "Yes" : "No"}
        </p>
      )}
      {!requestInProgress && (
        <button
          className="p-4 mt-4 bg-gray-500 rounded-lg text-white font-medium"
          onClick={createRequest}
        >
          Generate new request
        </button>
      )}
    </main>
  );
}
