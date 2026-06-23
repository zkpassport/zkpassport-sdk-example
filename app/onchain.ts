import type { ComponentProps } from "react";
import type { ZKPassportQRCode } from "@zkpassport/ui/react";
import { createPublicClient, http } from "viem";
import { mainnet, sepolia } from "viem/chains";

// Derive the `onResult` payload types from the QR component itself so the
// `sdkInstance` and `proof` we accept exactly match what the component hands to
// `onResult` — no coupling to a specific @zkpassport/sdk copy.
type OnResult = NonNullable<
  ComponentProps<typeof ZKPassportQRCode>["onResult"]
>;
type OnResultArg = Parameters<OnResult>[0];
type SolidityVerifierSdk = OnResultArg["sdkInstance"];
type Proof = OnResultArg["proofs"][number];

export type OnChainVerification = {
  isVerified: boolean;
  uniqueIdentifier: string;
};

/**
 * Submit a proof to the ZKPassport verifier contract and read back the result.
 *
 * The verifier contract lives at the same address on every chain (CREATE2), but
 * the registered certificate-registry root differs per environment: real
 * passports (devMode off) chain to the mainnet root, mock passports (devMode on)
 * to the Sepolia testnet root. Submitting a proof to the wrong chain reverts
 * with "Invalid certificate registry root", so we pick the chain from devMode.
 */
export async function verifyProofOnChain({
  sdkInstance,
  proof,
  scope,
  devMode,
}: {
  sdkInstance: SolidityVerifierSdk;
  proof: Proof;
  scope: string;
  devMode: boolean;
}): Promise<OnChainVerification> {
  const params = sdkInstance.getSolidityVerifierParameters({
    proof,
    scope,
    devMode,
  });

  const { address, abi, functionName } =
    sdkInstance.getSolidityVerifierDetails();

  const publicClient = devMode
    ? createPublicClient({
        chain: sepolia,
        transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
      })
    : createPublicClient({
        chain: mainnet,
        transport: http("https://ethereum-rpc.publicnode.com"),
      });

  const contractCallResult = await publicClient.readContract({
    address,
    abi,
    functionName,
    args: [params],
  });

  // The result is an array: [isValid: boolean, uniqueIdentifier].
  const isVerified = Array.isArray(contractCallResult)
    ? Boolean(contractCallResult[0])
    : false;
  const uniqueIdentifier = Array.isArray(contractCallResult)
    ? String(contractCallResult[1])
    : "";

  return { isVerified, uniqueIdentifier };
}
