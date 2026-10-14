"use client";
import { useState } from "react";
import { ZKPassportQRCode } from "@zkpassport/ui/react";
import { NullifierType } from "@zkpassport/sdk";

// Dedicated page for testing the App Clip (`/c`) invocation lane.
// The "Enable App Clips" checkbox flips `overrides.appClip`, which makes the SDK
// emit a `https://zkpassport.id/c?...` request URL (the no-install clip lane)
// instead of the default `/r`. Scan the QR with the iPhone Camera app to trigger
// the App Clip card.
export default function AppClipTest() {
  const [appClip, setAppClip] = useState(true);
  const [isOver18, setIsOver18] = useState<boolean | undefined>(undefined);

  return (
    <main
      className="w-full h-full flex flex-col items-center p-10"
      style={{ backgroundColor: "#f1f1f1", height: "100vh" }}
    >
      <label className="mb-6 flex items-center gap-2 text-sm text-gray-800 select-none">
        <input
          type="checkbox"
          checked={appClip}
          onChange={(e) => setAppClip(e.target.checked)}
        />
        Enable App Clips (<code>/c</code> lane)
      </label>

      <ZKPassportQRCode
        // Rebuild the request + QR when the lane toggles, so the URL path updates.
        key={appClip ? "appclip" : "default"}
        scope="age-check"
        name="Your App"
        purpose="Verify you are over 18"
        mode="fast"
        devMode={true}
        overrides={{ appClip }}
        uniqueIdentifierType={NullifierType.NONE}
        query={(queryBuilder) => queryBuilder.gte("age", 18).done()}
        onSuccess={async ({ proofs, result }) => {
          // Proofs have arrived (verify them on your backend before trusting).
          console.log("Proofs", proofs);
          console.log("Result of the query", result);
          setIsOver18(result?.age?.gte?.result);
          return true;
        }}
      />

      {typeof isOver18 === "boolean" && (
        <p className="mt-6">
          <b>Is over 18:</b> {isOver18 ? "Yes" : "No"}
        </p>
      )}
    </main>
  );
}
