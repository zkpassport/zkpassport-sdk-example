"use client";
import { useState } from "react";
import { VerifyWithZKPassport } from "@zkpassport/ui/react-button";

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
        service={{ scope: "age-check", devMode: true }}
        query={{
          firstname: { disclose: true },
          age: { min: 18 },
          // Other fields: lastname/fullname/gender/document_type/document_number: { disclose: true },
          // nationality/issuing_country: { included/excluded: [...], disclose: true },
          // sanctions: true, facematch: { mode: "regular" }
        }}
        onSuccess={async ({ proofs, result }) => {
          console.log("Proofs", proofs);
          console.log("Result of the query", result);
          setIsOver18(result?.age?.gte?.result);
          setFirstName(result?.firstname?.disclose?.result ?? "");
          console.log(
            "Birthdate",
            result?.birthdate?.disclose?.result.toDateString(),
          );

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
