"use client";
import { useState } from "react";
import { ZKPassportQRCode } from "@zkpassport/ui/react";
import { scenarios } from "../test-scenarios";
import { ScenarioPicker } from "../_components/ScenarioPicker";
import { ResultPanel } from "../_components/ResultPanel";
import { verifyProofOnChain } from "../onchain";

// All preconfigured scenarios for the latest SDK (@zkpassport/ui, v0.15):
// fast, compressed, and the EVM (on-chain) scenarios in one place.
const scenarioList = Object.values(scenarios);

/**
 * Preconfigured scenarios on the latest SDK. EVM scenarios
 * (`mode === "compressed-evm"`) are verified on-chain against the verifier
 * contract; all others use the off-chain `verified` flag and register the proof
 * with `/api/register`.
 */
export default function ScenariosPage() {
  const [scenario, setScenario] = useState(scenarioList[0]);
  const [devMode, setDevMode] = useState(true);
  const [isOver18, setIsOver18] = useState<boolean | undefined>(undefined);
  const [uniqueIdentifier, setUniqueIdentifier] = useState("");
  const [verified, setVerified] = useState<boolean | undefined>(undefined);
  const [onChainVerified, setOnChainVerified] = useState<boolean | undefined>(
    undefined,
  );

  const isEvm = scenario.mode === "compressed-evm";

  const selectScenario = (next: (typeof scenarioList)[number]) => {
    setScenario(next);
    setIsOver18(undefined);
    setUniqueIdentifier("");
    setVerified(undefined);
    setOnChainVerified(undefined);
  };

  return (
    <main
      className="flex w-full justify-center p-6"
      style={{ backgroundColor: "#f1f1f1", minHeight: "calc(100vh - 41px)" }}
    >
      <div className="flex w-full max-w-4xl flex-col gap-8 rounded-xl bg-white p-6 shadow-sm sm:flex-row">
        <ScenarioPicker
          scenarios={scenarioList}
          selectedId={scenario.id}
          onSelect={selectScenario}
          devMode={devMode}
          onDevModeChange={setDevMode}
        />

        <div className="flex flex-1 flex-col items-center">
          <ZKPassportQRCode
            // `key` fully regenerates the QR whenever the scenario or devMode changes.
            key={`${scenario.id}:${devMode}`}
            scope={scenario.id}
            name="Your App"
            purpose={scenario.purpose}
            mode={scenario.mode}
            devMode={devMode}
            uniqueIdentifierType={scenario.uniqueIdentifierType}
            query={(queryBuilder) => scenario.build(queryBuilder).done()}
            onResult={async ({
              result,
              uniqueIdentifier,
              uniqueIdentifierType,
              verified,
              queryResultErrors,
              proofs,
              sdkInstance,
            }) => {
              console.log("Proofs", proofs);
              console.log("Result of the query", result);
              console.log("Query result errors", queryResultErrors);
              console.log("Unique identifier type", uniqueIdentifierType);
              setIsOver18(result?.age?.gte?.result);
              console.log(
                "Birthdate",
                result?.birthdate?.disclose?.result?.toDateString(),
              );

              if (isEvm) {
                // On-chain verification path (EVM scenarios).
                try {
                  const { isVerified, uniqueIdentifier: onChainId } =
                    await verifyProofOnChain({
                      sdkInstance,
                      proof: proofs[0],
                      scope: scenario.id,
                      devMode,
                    });
                  setUniqueIdentifier(onChainId);
                  setOnChainVerified(isVerified);
                  if (!isVerified) {
                    console.warn(
                      "[scenarios] On-chain verification FAILED — proof not verified",
                      {
                        scenario: scenario.id,
                        mode: scenario.mode,
                        devMode,
                        queryResultErrors,
                        proofCount: proofs?.length ?? 0,
                      },
                    );
                  }
                } catch (error) {
                  setOnChainVerified(false);
                  console.error(
                    "[scenarios] Error during on-chain verification:",
                    error,
                    {
                      scenario: scenario.id,
                      mode: scenario.mode,
                      devMode,
                      queryResultErrors,
                      proofCount: proofs?.length ?? 0,
                    },
                  );
                }
                return;
              }

              // Off-chain verification path (fast / compressed scenarios).
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
                  scenarioId: scenario.id,
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
            onChainVerified={onChainVerified}
          />
        </div>
      </div>
    </main>
  );
}
