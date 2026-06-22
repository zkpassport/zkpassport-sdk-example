import {
  EU_COUNTRIES,
  ZKPassport as ZKPassportV14,
  type QueryResult,
  type ProofResult,
  type Query,
} from "@zkpassport/sdk-v14";
import { ZKPassport as ZKPassportV15 } from "@zkpassport/sdk-v15";
import { scenarios } from "../../test-scenarios";

export const config = {
  runtime: "edge",
};

/** Which SDK the proofs were generated with — selects the verifier version. */
type SdkVersion = "14" | "15";

export async function POST(request: Request) {
  const {
    queryResult,
    proofs,
    domain,
    scenarioId,
    query: providedQuery,
    sdkVersion = "15",
  }: {
    queryResult: QueryResult;
    proofs: ProofResult[];
    domain: string;
    scenarioId?: string;
    // Manual queries have no scenario id, so the client sends the query object
    // to verify against directly.
    query?: Query;
    sdkVersion?: SdkVersion;
  } = await request.json();

  // Verify with the SDK version that matches the route that produced the proofs:
  // the raw `/raw` route uses 0.14, the `@zkpassport/ui` QR component uses 0.15.
  // Verifying 0.15 proofs with the 0.14 verifier (or vice-versa) would fail.
  const zkpassport =
    sdkVersion === "14"
      ? new ZKPassportV14(domain)
      : new ZKPassportV15(domain);

  const scenario = scenarioId
    ? Object.values(scenarios).find((s) => s.id === scenarioId)
    : undefined;

  // Determine the query to verify the proofs against. verify() compares the
  // proofs to this `originalQuery`, so it must match what the app actually
  // proved or verification always fails.
  //   1. scenario id  → rebuild that scenario's exact query (tamper resistant)
  //   2. explicit query (manual mode) → verify against the provided query
  //   3. neither → fall back to the original hardcoded example query
  const builder = zkpassport.createQuery();
  let query: Query;
  if (scenario) {
    query = scenario.build(builder as never).done().query as Query;
  } else if (providedQuery) {
    query = providedQuery;
  } else {
    query = (
      await builder
        .in("nationality", [...EU_COUNTRIES, "Zero Knowledge Republic"])
        .disclose("firstname")
        .gte("age", 18)
        .disclose("document_type")
        .facematch("strict")
        .sanctions()
        .gte("age", 18)
        .done()
    ).query;
  }

  const { verified, uniqueIdentifier } = await zkpassport.verify({
    proofs,
    originalQuery: query,
    queryResult,
    devMode: true,
  });

  console.log(`Verified (sdk ${sdkVersion})`, verified);
  console.log("Unique identifier", uniqueIdentifier);

  // Do something with it, such as using the unique identifier to
  // identify the user in the database

  return Response.json({ registered: verified });
}
