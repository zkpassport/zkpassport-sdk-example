"use client";
import { useState } from "react";
import type { QueryBuilder, ProofMode } from "@zkpassport/sdk-v14";
import { scenarios } from "../test-scenarios";
import { RawZKPassportQRCode } from "./RawZKPassportQRCode";

const scenarioList = Object.values(scenarios);
const modeGroups = [
  { mode: "fast", label: "Regular" },
  { mode: "compressed", label: "Compressed" },
] as const;

// --- Manual query ----------------------------------------------------------
// A one-off query composed by hand, completely independent of the `scenarios`
// registry. Edit `buildManualQuery` to disclose/check whatever you want — it
// receives the SDK 0.14 QueryBuilder and returns it (`.done()` is called for
// you inside the component).
const MANUAL_PURPOSE = "Disclose firstname, lastname and fullname";

function buildManualQuery(q: QueryBuilder) {
  return q.disclose("firstname").disclose("lastname").disclose("fullname");
}

/**
 * Raw QR flow built directly on `@zkpassport/sdk` 0.14 (no `@zkpassport/ui`).
 *
 * Two query sources: a preconfigured scenario, or a hand-written manual query
 * (`buildManualQuery` above). Both feed the same `query` seam on the component.
 */
export default function RawHome() {
  const [source, setSource] = useState<"scenario" | "manual">("scenario");
  const [scenario, setScenario] = useState(scenarioList[0]);
  const [manualMode, setManualMode] = useState<ProofMode>("fast");
  const [devMode, setDevMode] = useState(true);
  const [isOver18, setIsOver18] = useState<boolean | undefined>(undefined);
  const [uniqueIdentifier, setUniqueIdentifier] = useState("");
  const [verified, setVerified] = useState<boolean | undefined>(undefined);

  const resetResult = () => {
    setIsOver18(undefined);
    setUniqueIdentifier("");
    setVerified(undefined);
  };

  // Map the active source to the request params + query function the component
  // needs. Scenario mode pulls from the registry; manual mode uses the inline
  // query above.
  const active =
    source === "manual"
      ? {
          scope: "manual",
          purpose: MANUAL_PURPOSE,
          mode: manualMode,
          uniqueIdentifierType: undefined as number | undefined,
          query: buildManualQuery,
          keyPart: `manual:${manualMode}`,
        }
      : {
          scope: scenario.id,
          purpose: scenario.purpose,
          mode: scenario.mode,
          uniqueIdentifierType: scenario.uniqueIdentifierType as
            | number
            | undefined,
          query: (q: QueryBuilder) =>
            scenario.build(q as never) as unknown as QueryBuilder,
          keyPart: scenario.id,
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
          value={source}
          onChange={(e) => {
            setSource(e.target.value as "scenario" | "manual");
            resetResult();
          }}
        >
          <option value="scenario">Preconfigured scenario</option>
          <option value="manual">Manual query</option>
        </select>

        {source === "scenario" ? (
          <select
            className="border border-gray-300 px-1 py-0.5"
            value={scenario.id}
            onChange={(e) => {
              setScenario(
                scenarioList.find((s) => s.id === e.target.value) ?? scenario,
              );
              resetResult();
            }}
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
        ) : (
          <select
            className="border border-gray-300 px-1 py-0.5"
            value={manualMode}
            onChange={(e) => {
              setManualMode(e.target.value as ProofMode);
              resetResult();
            }}
          >
            <option value="fast">Regular</option>
            <option value="compressed">Compressed</option>
          </select>
        )}

        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={devMode}
            onChange={(e) => {
              setDevMode(e.target.checked);
              resetResult();
            }}
          />
          devMode
        </label>
      </div>

      {source === "manual" && (
        <p className="mb-4 text-xs text-gray-500 max-w-md text-center">
          Manual query (edit <code>buildManualQuery</code> in{" "}
          <code>app/raw/page.tsx</code>): {MANUAL_PURPOSE}.
        </p>
      )}

      <RawZKPassportQRCode
        // `key` fully regenerates the QR (and the underlying request) whenever
        // the source, scenario/manual mode, or devMode changes.
        key={`${source}:${active.keyPart}:${devMode}`}
        scope={active.scope}
        purpose={active.purpose}
        mode={active.mode}
        devMode={devMode}
        uniqueIdentifierType={active.uniqueIdentifierType}
        query={active.query}
        onResult={async ({
          result,
          proofs,
          query,
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
              // Scenario mode: the server rebuilds the query from its id (tamper
              // resistant). Manual mode: there's no registry entry, so we hand
              // the server the query object to verify against.
              scenarioId: source === "scenario" ? scenario.id : undefined,
              query: source === "manual" ? query : undefined,
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
