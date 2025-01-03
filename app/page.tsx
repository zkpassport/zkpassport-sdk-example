"use client";
import { useState } from "react";
import { ZkPassport, ProofResult, EU_COUNTRIES } from "@zkpassport/sdk";
import QRCode from "react-qr-code";

export default function Home() {
  const [message, setMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isEUCitizen, setIsEUCitizen] = useState<boolean | undefined>(
    undefined
  );
  const [queryUrl, setQueryUrl] = useState("");
  const [requestInProgress, setRequestInProgress] = useState(false);

  let zkPassport: ZkPassport | null = null;
  if (typeof window !== "undefined") {
    zkPassport = new ZkPassport(window.location.hostname);
  }

  const createRequest = async () => {
    if (!zkPassport) {
      return;
    }
    setFirstName("");
    setIsEUCitizen(undefined);
    setMessage("");
    setQueryUrl("");

    const queryBuilder = await zkPassport.request({
      name: "ZKPassport",
      logo: "https://zkpassport.id/favicon.png",
      purpose: "Proof of EU citizenship and firstname",
    });

    const {
      url,
      onQRCodeScanned,
      onGeneratingProof,
      onProofGenerated,
      onReject,
      onError,
    } = queryBuilder
      .in("nationality", EU_COUNTRIES)
      .disclose("firstname")
      .done();

    setQueryUrl(url);
    console.log(url);

    setRequestInProgress(true);

    onQRCodeScanned(() => {
      console.log("QR code scanned");
      setMessage("Request received");
    });

    onGeneratingProof(() => {
      console.log("Generating proof");
      setMessage("Generating proof...");
    });

    onProofGenerated(async (result: ProofResult) => {
      console.log("Result of the query", result);
      setFirstName(result?.queryResult.firstname?.disclose?.result);
      setIsEUCitizen(result?.queryResult.nationality?.in?.result);
      setMessage("Proof generated");
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
