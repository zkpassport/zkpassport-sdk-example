import {
  CredentialScheme,
  CredentialTier,
  ProofResult,
  QueryResult,
  ZKPassport,
} from "@zkpassport/sdk";

export async function POST(request: Request) {
  const {
    result,
    proofs,
  }: {
    result: QueryResult;
    proofs: ProofResult[];
  } = await request.json();

  // Proofs are bound to the domain of the page that requested them
  const zkpassport = new ZKPassport(request.headers.get("host") ?? undefined);

  // Recreate the query to enforce the right conditions were checked by the app
  const { query } = zkpassport
    .createQuery()
    .disclose("firstname")
    // The button adds this to any request that discloses a field, so the verifier can tell
    // which kind of document the bytes come from; the recreated query must include it too
    .disclose("document_type")
    .gte("age", 18)
    .done();

  const {
    verified,
    uniqueIdentifier,
    credentialTier,
    credentialScheme,
    queryResultErrors,
  } = await zkpassport.verify({
    proofs,
    originalQuery: query,
    queryResult: result,
    scope: "age-check",
    devMode: true,
    // Must match what the page asked for, or an attested proof is refused here
    allowedCredentials: [
      CredentialTier.GOVERNMENT_SIGNED,
      CredentialScheme.ATTESTED_CAPTURE_IOS,
    ],
    // Verify against locally packaged circuits, served from the circuits repo with
    // `npm run serve-circuits`; the app must prove with the same server
    config: process.env.ZKPASSPORT_CIRCUITS_URL
      ? { circuitsUrl: process.env.ZKPASSPORT_CIRCUITS_URL }
      : undefined,
  });

  console.log("Verified", verified);
  console.log("Unique identifier", uniqueIdentifier);
  console.log("Credential tier", credentialTier, "scheme", credentialScheme);
  if (!verified) {
    console.log(
      "Verification errors",
      JSON.stringify(queryResultErrors, null, 2),
    );
  }

  // Do something with it, such as using the unique identifier to
  // identify the user in the database

  return Response.json({
    verified,
    uniqueIdentifier,
    credentialTier,
    credentialScheme,
  });
}
