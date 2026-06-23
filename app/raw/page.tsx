"use client";
import { useState } from "react";
import { scenarios } from "../test-scenarios";
import { RawZKPassportQRCode } from "./RawZKPassportQRCode";

const scenarioList = Object.values(scenarios);
const modeGroups = [
  { mode: "fast", label: "Fast" },
  { mode: "compressed", label: "Compressed" },
] as const;

/**
 * Raw QR flow built directly on `@zkpassport/sdk` 0.14 (no `@zkpassport/ui`).
 *
 * Mirrors the `/` page (which uses the `@zkpassport/ui` QR component): the QR
 * component renders the live proof-generation progress, and `onResult` reports
 * whether the proof was verified. The difference is the QR + progress here are
 * driven by the raw SDK because the React component only ships with 0.15+.
 */
export default function RawHome() {
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
      className="w-full min-h-screen flex flex-col items-center p-10"
      style={{ backgroundColor: "#f1f1f1" }}
    >
      <h1 className="mb-4 text-sm font-semibold text-gray-700">
        Raw QR code · @zkpassport/sdk 0.14
      </h1>

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

      <RawZKPassportQRCode
        // `key` fully regenerates the QR (and the underlying request) whenever
        // the scenario or devMode changes.
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

      <br />
      <hr className="w-full max-w-md" />
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
      {uniqueIdentifier && <p className="break-all max-w-md">{uniqueIdentifier}</p>}
      {verified !== undefined && (
        <p className="mt-2">
          <b>Verified:</b> {verified ? "Yes" : "No"}
        </p>
      )}
    </main>
  );
}
