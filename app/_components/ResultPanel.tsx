type Props = {
  isOver18?: boolean;
  uniqueIdentifier?: string;
  /** Off-chain verification result (verified flag from onResult). */
  verified?: boolean;
  /** On-chain verification result (verifier-contract read). */
  onChainVerified?: boolean;
};

/** Shared display of the proof outcome below the QR code. */
export function ResultPanel({
  isOver18,
  uniqueIdentifier,
  verified,
  onChainVerified,
}: Props) {
  const hasAnything =
    typeof isOver18 === "boolean" ||
    Boolean(uniqueIdentifier) ||
    typeof verified === "boolean" ||
    typeof onChainVerified === "boolean";

  if (!hasAnything) return null;

  return (
    <div className="mt-6 w-full max-w-md border-t border-gray-200 pt-4 text-sm">
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
      {uniqueIdentifier && <p className="break-all">{uniqueIdentifier}</p>}
      {typeof verified === "boolean" && (
        <p className="mt-2">
          <b>Verified:</b> {verified ? "Yes" : "No"}
        </p>
      )}
      {typeof onChainVerified === "boolean" && (
        <p className="mt-2">
          <b>Onchain Verified:</b> {onChainVerified ? "Yes" : "No"}
        </p>
      )}
    </div>
  );
}
