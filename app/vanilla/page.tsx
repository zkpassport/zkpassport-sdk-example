"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import type { VerifyWithZKPassportOptions } from "@zkpassport/ui/button";

type VerifyButtonHandle = { update(next: VerifyWithZKPassportOptions): void; unmount(): void };

declare global {
  interface Window {
    VerifyWithZKPassport?: {
      render(target: HTMLElement | string, options: VerifyWithZKPassportOptions): VerifyButtonHandle;
    };
  }
}

// Override with NEXT_PUBLIC_ZKPASSPORT_UI_SCRIPT to test a local build, e.g. /ui.js from public/
const SCRIPT_URL = process.env.NEXT_PUBLIC_ZKPASSPORT_UI_SCRIPT ?? "https://cdn.zkpassport.id/ui/v0/ui.js";

export default function Vanilla() {
  const container = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [isOver18, setIsOver18] = useState<boolean | undefined>(undefined);
  const [firstName, setFirstName] = useState("");
  const [verified, setVerified] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!scriptReady || !container.current || !window.VerifyWithZKPassport) return;
    const handle = window.VerifyWithZKPassport.render(container.current, {
      purpose: "Verify you are over 18",
      mode: "fast",
      service: { scope: "age-check", devMode: true },
      query: { age: { min: 18 }, firstname: { disclose: true } },
      onSuccess: async ({ proofs, result }) => {
        setIsOver18(result?.age?.gte?.result);
        setFirstName(result?.firstname?.disclose?.result ?? "");

        const res = await fetch("/api/register", {
          method: "POST",
          body: JSON.stringify({ proofs, result }),
        });
        const verification = await res.json();
        setVerified(verification.verified);
        return verification.verified;
      },
      onError: (error) => {
        if (!error.cancelled) console.error(error);
      },
    });
    return () => handle.unmount();
  }, [scriptReady]);

  return (
    <main
      className="w-full h-full flex flex-col items-center p-10"
      style={{ backgroundColor: "#f1f1f1", height: "100vh" }}
    >
      <Script src={SCRIPT_URL} onLoad={() => setScriptReady(true)} />
      <p className="mb-6 text-sm text-gray-600">
        Button rendered by <code>VerifyWithZKPassport.render</code> from <code>{SCRIPT_URL}</code>
      </p>
      <div ref={container} />
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
      {firstName && (
        <p className="mt-2">
          <b>First name:</b> {firstName}
        </p>
      )}
      {verified !== undefined && (
        <p className="mt-2">
          <b>Verified:</b> {verified ? "Yes" : "No"}
        </p>
      )}
    </main>
  );
}
