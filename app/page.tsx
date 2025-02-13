"use client";
import { useState } from "react";
import { ZKPassport, ProofResult, EU_COUNTRIES } from "@zkpassport/sdk";
import QRCode from "react-qr-code";

export default function Home() {
  const [message, setMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isEUCitizen, setIsEUCitizen] = useState<boolean | undefined>(undefined);
  const [isOver18, setIsOver18] = useState<boolean | undefined>(undefined);
  const [queryUrl, setQueryUrl] = useState("");
  const [uniqueIdentifier, setUniqueIdentifier] = useState("");
  const [verified, setVerified] = useState<boolean | undefined>(undefined);
  const [requestInProgress, setRequestInProgress] = useState(false);

  let zkPassport: ZKPassport | null = null;
  if (typeof window !== "undefined") {
    zkPassport = new ZKPassport(window.location.hostname);
  }

  const createRequest = async () => {
    if (!zkPassport) {
      return;
    }
    setFirstName("");
    setIsEUCitizen(undefined);
    setMessage("");
    setQueryUrl("");
    setIsOver18(undefined);
    setUniqueIdentifier("");
    setVerified(undefined);

    const queryBuilder = await zkPassport.request({
      name: "ZKPassport",
      logo: "https://zkpassport.id/favicon.png",
      purpose: "Proof of EU citizenship and firstname",
      scope: "eu-adult",
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
      .in("nationality", EU_COUNTRIES)
      .disclose("firstname")
      .gte("age", 18)
      .disclose("document_type")
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

    onProofGenerated((result: ProofResult) => {
      console.log("Proof result", result);
      setMessage(`Proofs received`);
      setRequestInProgress(false);
    });

    onResult(({ result, uniqueIdentifier, verified }) => {
      console.log("Result of the query", result);
      setFirstName(result?.firstname?.disclose?.result);
      setIsEUCitizen(result?.nationality?.in?.result);
      setIsOver18(result?.age?.gte?.result);
      setMessage("Result received");
      setUniqueIdentifier(uniqueIdentifier || "");
      setVerified(verified);
      setRequestInProgress(false);
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
