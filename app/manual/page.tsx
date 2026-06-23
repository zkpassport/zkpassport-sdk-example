"use client";
import { useState } from "react";
import { ZKPassportQRCode } from "@zkpassport/ui/react";
import { ResultPanel } from "../_components/ResultPanel";

/**
 * Manual query builder on the latest SDK (@zkpassport/ui). Edit the chained
 * `queryBuilder` calls below to compose whatever query you want to test —
 * uncomment the lines you need. Off-chain verification (see `/manual/evm` for
 * the on-chain variant).
 */
export default function ManualPage() {
  const [devMode, setDevMode] = useState(true);
  const [isOver18, setIsOver18] = useState<boolean | undefined>(undefined);
  const [uniqueIdentifier, setUniqueIdentifier] = useState("");
  const [verified, setVerified] = useState<boolean | undefined>(undefined);

  return (
    <main
      className="flex w-full flex-col items-center p-10"
      style={{ backgroundColor: "#f1f1f1", minHeight: "calc(100vh - 41px)" }}
    >
      <div className="mb-6 flex items-center gap-3 text-xs text-gray-600">
        <span className="font-semibold text-gray-500">
          Manual query builder · standard
        </span>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={devMode}
            onChange={(e) => setDevMode(e.target.checked)}
          />
          devMode
        </label>
      </div>

      <ZKPassportQRCode
        key={`manual:${devMode}`}
        scope="age-check"
        name="Your App"
        purpose="Verify you are over 18"
        mode="fast"
        devMode={devMode}
        query={(queryBuilder) =>
          queryBuilder
            // .disclose("firstname")
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
        onResult={async ({
          result,
          uniqueIdentifier,
          uniqueIdentifierType,
          verified,
          queryResultErrors,
          proofs,
        }) => {
          console.log("Proofs", proofs);
          console.log("Result of the query", result);
          console.log("Query result errors", queryResultErrors);
          setIsOver18(result?.age?.gte?.result);
          console.log(
            "Birthdate",
            result?.birthdate?.disclose?.result?.toDateString(),
          );
          setUniqueIdentifier(
            uniqueIdentifier
              ? `${uniqueIdentifier} (Type: ${uniqueIdentifierType})`
              : "",
          );
          setVerified(verified);

          const res = await fetch("/api/register", {
            method: "POST",
            body: JSON.stringify({
              sdkVersion: "15",
              queryResult: result,
              proofs,
              domain: window.location.hostname,
            }),
          });

          console.log("Response from the server", await res.json());
        }}
      />

      <ResultPanel
        isOver18={isOver18}
        uniqueIdentifier={uniqueIdentifier}
        verified={verified}
      />
    </main>
  );
}
