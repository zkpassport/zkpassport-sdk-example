"use client";
import { useState } from "react";
import { ZKPassportQRCode } from "@zkpassport/ui/react";
import { scenarios } from "./test-scenarios";

const scenarioList = Object.values(scenarios);
const modeGroups = [
  { mode: "fast", label: "Regular" },
  { mode: "compressed", label: "Compressed" },
] as const;

export default function Home() {
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
      className="w-full h-full flex flex-col items-center p-10"
      style={{ backgroundColor: "#f1f1f1", height: "100vh" }}
    >
      {/* Dev controls */}
      <div className="mb-6 flex items-center gap-3 text-xs text-gray-600">
        <select
          className="border border-gray-300 px-1 py-0.5"
          value={scenario.id}
          onChange={(e) =>
            selectScenario(
              scenarioList.find((s) => s.id === e.target.value) ?? scenario,
            )
          }
        >
          {modeGroups.map((g) => (
            <optgroup key={g.mode} label={g.label}>
              {scenarioList
                .filter((s) => s.mode === g.mode)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
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
        }) => {
          console.log("Proofs", proofs);
          console.log("Result of the query", result);
          console.log("Query result errors", queryResultErrors);
          console.log("Unique identifier type", uniqueIdentifierType);
          setIsOver18(result?.age?.gte?.result);
          console.log(
            "Birthdate",
            result?.birthdate?.disclose?.result.toDateString(),
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
              scenarioId: scenario.id,
              queryResult: result,
              proofs,
              domain: window.location.hostname,
            }),
          });

          console.log("Response from the server", await res.json());
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
