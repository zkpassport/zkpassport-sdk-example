"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import {
  ZKPassport,
  type QueryBuilder,
  type ProofResult,
  type QueryResult,
  type NullifierType,
  type QueryResultErrors,
} from "@zkpassport/sdk-v14";
import type { Scenario } from "../../test-scenarios";

/**
 * The payload we hand back to the page once the user finishes the flow.
 *
 * Note: SDK 0.14's `onResult` does *not* include the proofs (unlike the
 * `@zkpassport/ui` component released with 0.15). We collect them ourselves
 * from `onProofGenerated` and bundle them in here so the page can POST them to
 * `/api/register` for verification.
 */
export type RawResult = {
  result: QueryResult;
  proofs: ProofResult[];
  uniqueIdentifier: string | undefined;
  uniqueIdentifierType: NullifierType | undefined;
  verified: boolean;
  queryResultErrors?: Partial<QueryResultErrors>;
};

type Props = {
  scenario: Scenario;
  devMode: boolean;
  onResult: (payload: RawResult) => void | Promise<void>;
};

/**
 * The flow lifecycle. On SDK 0.14 the `@zkpassport/ui` QR component (which
 * renders this progress for you) doesn't exist, so we reproduce it from the
 * raw `request()` callbacks: scan → request received → generating → result.
 */
type Phase =
  | "preparing"
  | "waiting"
  | "received"
  | "generating"
  | "result"
  | "rejected"
  | "error";

const PROGRESS_STEPS: { key: Phase; label: string }[] = [
  { key: "waiting", label: "Waiting for the user to scan the QR code" },
  { key: "received", label: "Request received — reviewing on phone" },
  { key: "generating", label: "Generating the proof on the phone" },
  { key: "result", label: "Result received" },
];

const PHASE_ORDER: Record<Phase, number> = {
  preparing: -1,
  waiting: 0,
  received: 1,
  generating: 2,
  result: 3,
  rejected: 99,
  error: 99,
};

/**
 * A "raw" QR code built directly on top of `@zkpassport/sdk` 0.14.
 *
 * The declarative `<ZKPassportQRCode>` component only ships with
 * `@zkpassport/ui` (0.15+), so on 0.14 we drive the request imperatively:
 * `request()` → build the query → `done()` → render the returned `url` as a
 * QR code with `react-qr-code`, wire up the lifecycle callbacks, and render the
 * progress + verification result ourselves (what the UI component does for us).
 *
 * Remount this component (via a `key`) to generate a fresh request — that's
 * how the page regenerates the QR when the scenario or devMode changes.
 */
export function RawZKPassportQRCode({ scenario, devMode, onResult }: Props) {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("preparing");
  const [proofCount, setProofCount] = useState(0);
  const [verified, setVerified] = useState<boolean | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Latest onResult without retriggering the effect (effect runs once per mount).
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    let cancelled = false;
    let zkPassport: ZKPassport | undefined;
    let requestId: string | undefined;
    const proofs: ProofResult[] = [];

    async function setup() {
      try {
        // `new ZKPassport(domain)` must run in the browser — hence the effect.
        zkPassport = new ZKPassport(window.location.hostname);

        const queryBuilder = await zkPassport.request({
          name: "Your App",
          // `logo` is a required string in 0.14's request(); point it at our favicon.
          logo: `${window.location.origin}/favicon.ico`,
          purpose: scenario.purpose,
          scope: scenario.id,
          mode: scenario.mode,
          devMode,
          uniqueIdentifierType: scenario.uniqueIdentifierType as never,
        });
        if (cancelled) return;

        // The scenario's `build` is typed against the QueryBuilder bundled with
        // @zkpassport/ui; structurally it's the same chainable builder, so we
        // cast it onto the SDK 0.14 builder we actually hold here.
        const built = scenario.build(
          queryBuilder as never,
        ) as unknown as QueryBuilder;

        const {
          url,
          requestId: id,
          onRequestReceived,
          onGeneratingProof,
          onProofGenerated,
          onResult: onSdkResult,
          onReject,
          onError,
        } = built.done();

        requestId = id;
        setUrl(url);
        setPhase("waiting");

        onRequestReceived(() => setPhase("received"));
        onGeneratingProof(() => setPhase("generating"));
        onProofGenerated((proof) => {
          proofs.push(proof);
          setProofCount(proofs.length);
          setPhase("generating");
        });
        onSdkResult((response) => {
          setVerified(response.verified);
          setPhase("result");
          void onResultRef.current({ ...response, proofs });
        });
        onReject(() => setPhase("rejected"));
        onError((err) => {
          setError(err);
          setPhase("error");
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setPhase("error");
      }
    }

    setup();

    return () => {
      cancelled = true;
      // Tear down the bridge connection for this request so a remount (e.g. on
      // scenario switch, or React StrictMode's double-mount in dev) starts clean.
      if (zkPassport && requestId) {
        try {
          zkPassport.cancelRequest(requestId);
        } catch {
          // best-effort cleanup
        }
      }
    };
    // Runs once per mount; the page forces a fresh mount via `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = PHASE_ORDER[phase];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4">
        {url ? (
          <QRCode value={url} size={280} />
        ) : (
          <div
            className="flex items-center justify-center text-xs text-gray-400"
            style={{ width: 280, height: 280 }}
          >
            Preparing QR code…
          </div>
        )}
      </div>

      {url && (
        <a
          href={url}
          className="text-xs text-blue-600 underline break-all max-w-[280px] text-center"
        >
          Open request link
        </a>
      )}

      {/* Live progress — what the @zkpassport/ui QR component renders on 0.15. */}
      <ol className="w-[280px] space-y-1.5 text-xs">
        {PROGRESS_STEPS.map((step) => {
          const index = PHASE_ORDER[step.key];
          const done = current > index;
          const active = current === index;
          const isGenerating = step.key === "generating";
          return (
            <li key={step.key} className="flex items-center gap-2">
              <span
                className={
                  done
                    ? "text-green-600"
                    : active
                    ? "text-blue-600"
                    : "text-gray-300"
                }
              >
                {done ? "✓" : active ? "●" : "○"}
              </span>
              <span
                className={
                  done
                    ? "text-gray-500"
                    : active
                    ? "text-gray-900 font-medium"
                    : "text-gray-400"
                }
              >
                {step.label}
                {isGenerating && proofCount > 0 && (
                  <span className="text-gray-500">
                    {" "}
                    — {proofCount} proof{proofCount === 1 ? "" : "s"} generated
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      {/* The result from onResult: is the proof verified or not. */}
      {phase === "result" && (
        <div
          className={`w-[280px] text-center px-3 py-2 rounded font-semibold ${
            verified
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {verified ? "✓ Proof verified" : "✕ Proof not verified"}
        </div>
      )}

      {phase === "rejected" && (
        <div className="w-[280px] text-center px-3 py-2 rounded bg-amber-100 text-amber-900 text-sm">
          Request rejected on the phone.
        </div>
      )}

      {phase === "error" && error && (
        <div className="w-[280px] px-3 py-2 rounded bg-red-100 text-red-800 text-xs break-words">
          <b>Error:</b> {error}
        </div>
      )}
    </div>
  );
}
