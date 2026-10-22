"use client";
import { useState } from "react";
import {
  CredentialScheme,
  CredentialTier,
  VerifyWithZKPassport,
} from "@zkpassport/ui/react-button";

export default function Home() {
  const [isOver18, setIsOver18] = useState<boolean | undefined>(undefined);
  const [firstName, setFirstName] = useState("");
  const [uniqueIdentifier, setUniqueIdentifier] = useState("");
  const [verified, setVerified] = useState<boolean | undefined>(undefined);

  return (
    <main
      className="w-full h-full flex flex-col items-center p-10"
      style={{ backgroundColor: "#f1f1f1", height: "100vh" }}
    >
      <VerifyWithZKPassport
        purpose="Verify you are over 18"
        mode="fast"
        service={{
          scope: "age-check",
          devMode: true,
          // Which credentials to accept: any government-signed ID, plus a passport read by
          // camera and attested on iOS. Unset accepts signed IDs only.
          allowedCredentials: [
            CredentialTier.GOVERNMENT_SIGNED,
            CredentialScheme.ATTESTED_CAPTURE_IOS,
          ],
        }}
        // A popup served locally (`bun run dev` in verify-popup), for example to verify against
        // circuits that are not published yet; unset uses verify.zkpassport.id
        overrides={{ popupUrl: process.env.NEXT_PUBLIC_ZKPASSPORT_POPUP_URL }}
        query={{
          age: { min: 18 },
          firstname: { disclose: true },
          // lastname: { disclose: true },
          // fullname: { disclose: true },
          // gender: { disclose: true },
          // document_type: { disclose: true },
          // document_number: { disclose: true },
          // birthdate: { disclose: true },
          // expiry_date: { min: new Date("2025-01-01") },
          // nationality: { included: ["Zero Knowledge Republic"] },
          // issuing_country: { excluded: ["AFG"] },
          // facematch: { mode: "regular" },
          // sanctions: true,
          // bind: { user_address: "0x5e4B11F7B7995F5Cee0134692a422b045091112F" },
        }}
        onSuccess={async ({ proofs, result }) => {
          console.log("Proofs", proofs);
          console.log("Result of the query", result);
          setIsOver18(result?.age?.gte?.result);
          setFirstName(result?.firstname?.disclose?.result ?? "");

          // Always verify the proofs on your backend before trusting the result.
          const res = await fetch("/api/register", {
            method: "POST",
            body: JSON.stringify({ proofs, result }),
          });
          const verification = await res.json();
          console.log("Response from the server", verification);

          setUniqueIdentifier(verification.uniqueIdentifier ?? "");
          setVerified(verification.verified);
          return verification.verified;
        }}
      />
      <br />
      <br />
      <hr />
      <br />
      <br />
      {typeof isOver18 === "boolean" && (
        <p className="mt-2">
          <b>Is over 18:</b> {isOver18 ? "Yes" : "No"}
        </p>
      )}
      {firstName && (
        <p className="mt-2">
          <b>First name:</b> {firstName}
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
    </main>
  );
}
