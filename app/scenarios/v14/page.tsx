"use client";
import { useState } from "react";
import { scenarios } from "../../test-scenarios";
import { ScenarioPicker } from "../../_components/ScenarioPicker";
import { ResultPanel } from "../../_components/ResultPanel";
import { RawZKPassportQRCode } from "./RawZKPassportQRCode";

// SDK 0.14's raw flow has no on-chain path — fast and compressed scenarios only.
const scenarioList = Object.values(scenarios).filter(
  (s) => s.mode === "fast" || s.mode === "compressed",
);

/**
 * Preconfigured scenarios driven directly by `@zkpassport/sdk` 0.14 (no
 * `@zkpassport/ui`). The declarative `<ZKPassportQRCode>` component only ships
 * with 0.15+, so `RawZKPassportQRCode` reproduces the QR + progress UI from the
 * raw `request()` callbacks.
 */
export default function ScenariosV14Page() {
  const [scenario, setScenario] = useState(scenarioList[0]);
  const [devMode, setDevMode] = useState(true);
  const [isOver18, setIsOver18] = useState<boolean | undefined>(undefined);
  const [uniqueIdentifier, setUniqueIdentifier] = useState("");
  const [verified, setVerified] = useState<boolean | undefined>(undefined);

  const selectScenario = (next: (typeof scenarioList)[number]) => {
    setScenario(next);
    setIsOver18(undefined);
    setUniqueIdentifier("");
    setVerified(undefined);
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
          <p className="mb-4 text-xs font-semibold text-gray-500">
            Raw QR code · @zkpassport/sdk 0.14
          </p>

          <RawZKPassportQRCode
            // `key` fully regenerates the QR (and the underlying request)
            // whenever the scenario or devMode changes.
            key={`${scenario.id}:${devMode}`}
            scenario={scenario}
            devMode={devMode}
            onResult={async ({
              result,
              proofs,
              uniqueIdentifier,
              uniqueIdentifierType,
              verified,
              queryResultErrors,
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
              setUniqueIdentifier(
                uniqueIdentifier
                  ? `${uniqueIdentifier} (Type: ${uniqueIdentifierType})`
                  : "",
              );
              setVerified(verified);

              const res = await fetch("/api/register", {
                method: "POST",
                body: JSON.stringify({
                  sdkVersion: "14",
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
          />
        </div>
      </div>
    </main>
  );
}
