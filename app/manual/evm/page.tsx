"use client";
import { useState } from "react";
import { ZKPassportQRCode } from "@zkpassport/ui/react";
import { ResultPanel } from "../../_components/ResultPanel";
import { verifyProofOnChain } from "../../onchain";

const SCOPE = "age-check";

/**
 * Manual query builder on the latest SDK (@zkpassport/ui), EVM variant. Edit the
 * chained `queryBuilder` calls below to compose your query, then the proof is
 * verified on-chain against the ZKPassport verifier contract (Sepolia in
 * devMode, mainnet otherwise).
 */
export default function ManualEvmPage() {
  const [devMode, setDevMode] = useState(true);
  const [isOver18, setIsOver18] = useState<boolean | undefined>(undefined);
  const [uniqueIdentifier, setUniqueIdentifier] = useState("");
  const [onChainVerified, setOnChainVerified] = useState<boolean | undefined>(
    undefined,
  );

  return (
    <main
      className="flex w-full flex-col items-center p-10"
      style={{ backgroundColor: "#f1f1f1", minHeight: "calc(100vh - 41px)" }}
    >
      <div className="mb-6 flex items-center gap-3 text-xs text-gray-600">
        <span className="font-semibold text-gray-500">
          Manual query builder · EVM (on-chain)
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
        key={`manual-evm:${devMode}`}
        scope={SCOPE}
        name="Your app"
        purpose="Verify you are over 18"
        mode="compressed-evm"
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
          queryResultErrors,
          proofs,
          sdkInstance,
        }) => {
          console.log("Proofs", proofs);
          console.log("Result of the query", result);
          console.log("Query result errors", queryResultErrors);
          setIsOver18(result?.age?.gte?.result);
          console.log(
            "Birthdate",
            result?.birthdate?.disclose?.result?.toDateString(),
          );
          setUniqueIdentifier(uniqueIdentifier || "");
          try {
            const { isVerified, uniqueIdentifier: onChainId } =
              await verifyProofOnChain({
                sdkInstance,
                proof: proofs[0],
                scope: SCOPE,
                devMode,
              });
            console.log("Unique identifier (on-chain)", onChainId);
            setOnChainVerified(isVerified);
            if (!isVerified) {
              console.warn(
                "[manual/evm] On-chain verification FAILED — proof not verified",
                { devMode, scope: SCOPE, queryResultErrors },
              );
            }
          } catch (error) {
            setOnChainVerified(false);
            console.error(
              "[manual/evm] Error during on-chain verification:",
              error,
            );
          }
        }}
      />

      <ResultPanel
        isOver18={isOver18}
        uniqueIdentifier={uniqueIdentifier}
        onChainVerified={onChainVerified}
      />
    </main>
  );
}
