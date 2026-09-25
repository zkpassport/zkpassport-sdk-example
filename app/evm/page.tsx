"use client";
import { useState } from "react";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { ZKPassport } from "@zkpassport/sdk";
import { VerifyWithZKPassport } from "@zkpassport/ui/react-button";

export default function Home() {
  const [isOver18, setIsOver18] = useState<boolean | undefined>(undefined);
  const [uniqueIdentifier, setUniqueIdentifier] = useState("");
  const [onChainVerified, setOnChainVerified] = useState<boolean | undefined>(
    undefined,
  );

  return (
    <main
      className="w-full h-full flex flex-col items-center p-10"
      style={{ backgroundColor: "#f1f1f1", height: "100vh" }}
    >
      <VerifyWithZKPassport
        scope="age-check"
        name="Your app"
        purpose="Verify you are over 18"
        mode="compressed-evm"
        devMode={true}
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
        onSuccess={async ({ proofs, result }) => {
          console.log("Proofs", proofs);
          console.log("Result of the query", result);
          setIsOver18(result?.age?.gte?.result);
          console.log(
            "Birthdate",
            result?.birthdate?.disclose?.result.toDateString(),
          );
          try {
            const zkpassport = new ZKPassport(window.location.hostname);
            const params = zkpassport.getSolidityVerifierParameters({
              proof: proofs[0],
              scope: "age-check",
              devMode: true,
            });

            const { address, abi, functionName } =
              zkpassport.getSolidityVerifierDetails();

            const publicClient = createPublicClient({
              chain: sepolia,
              transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
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
            setUniqueIdentifier(uniqueIdentifier);
            setOnChainVerified(isVerified);
            return isVerified;
          } catch (error) {
            console.error("Error preparing verification:", error);
            return false;
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
