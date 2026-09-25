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
        scope="age-check"
        name="Your App"
        purpose="Verify you are over 18"
        mode="fast"
        devMode={true}
        query={(queryBuilder) =>
          queryBuilder
            .disclose("firstname")
            // .disclose("lastname")
            // .disclose("document_type")
            // .disclose("document_number")
            // .disclose("fullname")
            // .disclose("gender")
            // .gte("expiry_date", new Date("2025-01-01"))
            .gte("age", 18)
            // .lte("age", 99)
            // .out("issuing_country", ["AFG"])
            // .in("issuing_country", ["Zero Knowledge Republic"])
            // .facematch("regular")
            // .sanctions("all")
            // .in("nationality", ["Zero Knowledge Republic"])
            // .out("nationality", ["AFG"])
            // .bind("user_address", "0x5e4B11F7B7995F5Cee0134692a422b045091112F")
            // .bind("chain", "ethereum_sepolia")
            // .bind("custom_data", "email:test@test.com,customer_id:1234567890")
            .done()
        }
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
