"use client";
import { useState } from "react";
import { createPublicClient, http } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { ZKPassportQRCode } from "@zkpassport/ui/react";
import { scenarios } from "../test-scenarios";

const scenarioList = Object.values(scenarios).filter(
  (s) => s.mode === "compressed-evm",
);
const modeGroups = [{ mode: "compressed-evm", label: "EVM" }] as const;

export default function Home() {
  const [scenario, setScenario] = useState(scenarioList[0]);
  const [devMode, setDevMode] = useState(true);
  const [isOver18, setIsOver18] = useState<boolean | undefined>(undefined);
  const [uniqueIdentifier, setUniqueIdentifier] = useState("");
  const [onChainVerified, setOnChainVerified] = useState<boolean | undefined>(
    undefined,
  );

  const selectScenario = (next: (typeof scenarioList)[number]) => {
    setScenario(next);
    setIsOver18(undefined);
    setUniqueIdentifier("");
    setOnChainVerified(undefined);
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
            const params = sdkInstance.getSolidityVerifierParameters({
              proof: proofs[0],
              scope: scenario.id,
              devMode,
            });

            const { address, abi, functionName } =
              sdkInstance.getSolidityVerifierDetails();

            // The verifier contract lives at the same address on every chain
            // (CREATE2), but the registered certificate-registry root differs
            // per environment: real passports (devMode off) chain to the
            // mainnet root, mock passports (devMode on) to the Sepolia testnet
            // root. Submitting a proof to the wrong chain reverts with
            // "Invalid certificate registry root".
            const publicClient = devMode
              ? createPublicClient({
                  chain: sepolia,
                  transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
                })
              : createPublicClient({
                  chain: mainnet,
                  transport: http("https://ethereum-rpc.publicnode.com"),
                });

            // Use the public client to call the verify function of the ZKPassport verifier contract
            const contractCallResult = await publicClient.readContract({
              address,
              abi,
              functionName,
              args: [params],
            });

            console.log("Contract call result", contractCallResult);
            // The result is an array with the first element being a boolean indicating if the proof is valid
            // and the second element being the unique identifier
            const isVerified = Array.isArray(contractCallResult)
              ? Boolean(contractCallResult[0])
              : false;
            const uniqueIdentifier = Array.isArray(contractCallResult)
              ? String(contractCallResult[1])
              : "";
            console.log("Unique identifier", uniqueIdentifier);
            setOnChainVerified(isVerified);

            if (!isVerified) {
              console.warn(
                "[evm] On-chain verification FAILED — proof not verified",
                {
                  scenario: scenario.id,
                  mode: scenario.mode,
                  devMode,
                  scope: scenario.id,
                  verifierAddress: address,
                  functionName,
                  contractCallResult,
                  queryResultErrors,
                  hasProof: Boolean(proofs?.[0]),
                  proofCount: proofs?.length ?? 0,
                },
              );
            }
          } catch (error) {
            // The proof could not even be submitted for verification (param
            // generation or the on-chain read failed).
            setOnChainVerified(false);
            console.error("[evm] Error during on-chain verification:", error, {
              scenario: scenario.id,
              mode: scenario.mode,
              devMode,
              scope: scenario.id,
              queryResultErrors,
              hasProof: Boolean(proofs?.[0]),
              proofCount: proofs?.length ?? 0,
            });
          }
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
      {onChainVerified !== undefined && (
        <p className="mt-2">
          <b>Onchain Verified:</b> {onChainVerified ? "Yes" : "No"}
        </p>
      )}
    </main>
  );
}
