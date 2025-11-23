"use client";
import { useEffect, useRef, useState } from "react";
import { ZKPassport, type ProofResult, EU_COUNTRIES } from "@zkpassport/sdk";
import QRCode from "react-qr-code";
import { withPaymentInterceptor } from "@space-meridian/x402-axios";
import { createWalletClient, custom, type WalletClient } from 'viem';
import { baseSepolia } from 'viem/chains';
import type { Hex } from 'viem';
import axios from "axios";

// Base axios instance without payment interceptor
const baseApiClient = axios.create({
  baseURL: "http://localhost:4021",
  headers: {
    "Content-Type": "application/json",
  },
});

export default function Home() {
  const [message, setMessage] = useState("");
  const [firstName, setFirstName] = useState<string | undefined>(undefined);
  const [isEUCitizen, setIsEUCitizen] = useState<boolean | undefined>(undefined);
  const [isOver18, setIsOver18] = useState<boolean | undefined>(undefined);
  const [queryUrl, setQueryUrl] = useState("");
  const [uniqueIdentifier, setUniqueIdentifier] = useState("");
  const [verified, setVerified] = useState<boolean | undefined>(undefined);
  const [requestInProgress, setRequestInProgress] = useState(false);
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
    setFirstName("");
    setIsEUCitizen(undefined);
    setMessage("");
    setQueryUrl("");
    setIsOver18(undefined);
    setUniqueIdentifier("");
    setVerified(undefined);

    const queryBuilder = await zkPassportRef.current.request({
      name: "ZKPassport",
      logo: "https://zkpassport.id/favicon.png",
      purpose: "Proof of EU citizenship and firstname",
      scope: "eu-adult",
      mode: "fast",
      devMode: true,
    });

    const {
      url,
      onRequestReceived,
      onGeneratingProof,
      onProofGenerated,
      onResult,
      onReject,
      onError,
    } = queryBuilder
      // .in("nationality", [...EU_COUNTRIES, "Zero Knowledge Republic"])
      .disclose("firstname")
      .gte("age", 18)
      .disclose("document_type")
      //.facematch("regular")
      .sanctions()
      .gte("age", 18)
      .done();

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

    onProofGenerated((result: ProofResult) => {
      console.log("Proof result", result);
      proofs.push(result);
      setMessage(`Proofs received`);
      setRequestInProgress(false);
    });

    onResult(async ({ result, uniqueIdentifier, verified, queryResultErrors }) => {
      console.log("Result of the query", result);
      console.log("Query result errors", queryResultErrors);
      setFirstName(result?.firstname?.disclose?.result);
      setIsEUCitizen(result?.nationality?.in?.result);
      setIsOver18(result?.age?.gte?.result);
      setMessage("Result received");
      console.log("Birthdate", result?.birthdate?.disclose?.result.toDateString());
      setUniqueIdentifier(uniqueIdentifier || "");
      setVerified(verified);
      setRequestInProgress(false);

      {
        const res = await fetch("/api/register", {
          method: "POST",
          body: JSON.stringify({
            queryResult: result,
            proofs,
            domain: window.location.hostname,
          }),
        });

        console.log("Response from the server", await res.json());
      }

      {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        }) as string[];
        if (accounts.length === 0) {
          throw new Error('No accounts found');
        }
        const chainId = await window.ethereum.request({ 
          method: 'eth_chainId' 
        }) as string;
        const baseSepoliaChainIdHex = '0x14a34'; // 84532 in hex
        if (chainId !== baseSepoliaChainIdHex) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: baseSepoliaChainIdHex }],
            });
          } catch (switchError: any) {
            // This error code indicates that the chain has not been added to browser wallet
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: baseSepoliaChainIdHex,
                  chainName: 'Base Sepolia',
                  nativeCurrency: {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://sepolia.base.org'],
                  blockExplorerUrls: ['https://sepolia.basescan.org'],
                }],
              });
            } else {
              throw switchError;
            }
          }
        }
        // Create viem wallet client
        const client = createWalletClient({
          account: accounts[0] as Hex,
          chain: baseSepolia,
          transport: custom(window.ethereum)
        });

        const apiClient = withPaymentInterceptor(
          baseApiClient,
          client as any,
          undefined,
          undefined,
          JSON.stringify({
            queryResult: result,
            proofs
          })
        );

        const res = await apiClient.get("/weather", {
          mode: 'cors',
        })
        console.log("Response from x402 server", res.data);
      }
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
      {firstName && (
        <p className="mt-2">
          <b>Firstname:</b> {firstName}
        </p>
      )}
      {typeof isEUCitizen === "boolean" && (
        <p className="mt-2">
          <b>Is EU citizen:</b> {isEUCitizen ? "Yes" : "No"}
        </p>
      )}
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
