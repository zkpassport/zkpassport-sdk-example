import type { ComponentProps } from "react";
import type { ZKPassportQRCode } from "@zkpassport/ui/react";

// Derive the query-builder, nullifier and proof-mode types from the QR
// component's own props. This keeps scenarios in sync with whatever
// @zkpassport/sdk copy the component resolves, sidestepping the version skew
// between the app's sdk and the one bundled with @zkpassport/ui.
type QRProps = ComponentProps<typeof ZKPassportQRCode>;
type QueryBuilder = Parameters<QRProps["query"]>[0];
type UniqueIdentifierType = QRProps["uniqueIdentifierType"];
type ProofMode = NonNullable<QRProps["mode"]>;

/**
 * A predefined test scenario for the ZKPassport flow.
 *
 * Each scenario bundles everything that varies between tests so you can flip
 * between them from the dropdown in `page.tsx`. Add a new test by adding one
 * entry to the `scenarios` object below.
 */
export type Scenario = {
  /** Stable id, also used as the request scope and to force a fresh QR on switch. */
  id: string;
  /** Human label shown in the selector — "Mode · disclosures · nullifier". */
  label: string;
  /** One-line explanation of what the proof does. */
  description: string;
  /** Purpose string shown to the user in the mobile app. */
  purpose: string;
  /** Proof mode: "fast" (regular), "compressed", or "compressed-evm". */
  mode: ProofMode;
  /**
   * Salted (OPRF) nullifier. Leave undefined for the default non-salted nullifier.
   * Note: the salted nullifier requires strict facematch — use `withFacematch`.
   */
  uniqueIdentifierType?: UniqueIdentifierType;
  /** Composes the query. `.done()` is called for you in `page.tsx`. */
  build: (q: QueryBuilder) => QueryBuilder;
};

// NullifierType.SALTED === 1. Assigned directly to avoid importing the enum
// from a specific @zkpassport/sdk copy (the app's vs. the one bundled with ui).
const SALTED: UniqueIdentifierType = 1;

// --- Reusable query fragments ----------------------------------------------

/** A few disclosures — a representative subset. */
const fewDisclosures = (q: QueryBuilder) =>
  q.disclose("firstname").disclose("lastname").disclose("birthdate");

/**
 * Disclose every attribute the SDK's `disclose()` accepts. (The mobile app
 * presents these as ~13 toggleable fields; they collapse to these 10 here.)
 */
const allDisclosures = (q: QueryBuilder) =>
  q
    .disclose("firstname")
    .disclose("lastname")
    .disclose("fullname")
    .disclose("birthdate")
    .disclose("nationality")
    .disclose("gender")
    .disclose("document_type")
    .disclose("document_number")
    .disclose("issuing_country")
    .disclose("expiry_date");

/** Strict facematch — mandatory when using the salted (OPRF) nullifier. */
const withFacematch = (q: QueryBuilder) => q.facematch("strict");

// --- Scenarios (one per testing-checklist item) ----------------------------
// Keyed by name. Grouped by proof mode (Regular first, then Compressed), and
// within each group ordered from least to most likely to fail — so you can
// test top-to-bottom.

export const scenarios: Record<
  | "regularFewDefault"
  | "regularAllDefault"
  | "regularSalted"
  | "compressedAllDefault"
  | "compressedSalted",
  Scenario
> = {
  regularFewDefault: {
    id: "regular-few-default",
    label: "Regular · few disclosures · non-salted",
    description: "Fast proof, a few disclosures, default nullifier.",
    purpose: "Disclose a few attributes",
    mode: "fast",
    build: fewDisclosures,
  },
  regularAllDefault: {
    id: "regular-all-default",
    label: "Regular · all disclosures · non-salted",
    description: "Fast proof, all disclosures, default nullifier.",
    purpose: "Disclose all document attributes",
    mode: "fast",
    build: allDisclosures,
  },
  regularSalted: {
    id: "regular-salted",
    label: "Regular · few disclosures · salted",
    description: "Fast proof, a few disclosures, salted nullifier + strict facematch.",
    purpose: "Disclose a few attributes",
    mode: "fast",
    uniqueIdentifierType: SALTED,
    build: (q) => withFacematch(fewDisclosures(q)),
  },
  compressedAllDefault: {
    id: "compressed-all-default",
    label: "Compressed · all disclosures · non-salted",
    description: "Compressed proof, all disclosures, default nullifier.",
    purpose: "Disclose all document attributes",
    mode: "compressed",
    build: allDisclosures,
  },
  compressedSalted: {
    id: "compressed-salted",
    label: "Compressed · few disclosures · salted",
    description: "Compressed proof, a few disclosures, salted nullifier + strict facematch.",
    purpose: "Disclose a few attributes",
    mode: "compressed",
    uniqueIdentifierType: SALTED,
    build: (q) => withFacematch(fewDisclosures(q)),
  },
};
