import { ProofResult, QueryResult, VerificationTier, ZKPassport } from "@zkpassport/sdk";

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
    .gte("age", 18)
    .done();

  const { verified, uniqueIdentifier } = await zkpassport.verify({
    proofs,
    originalQuery: query,
    queryResult: result,
    scope: "age-check",
    devMode: true,
    // Must match what the request accepted, or verify() refuses tier 2 proofs
    allowedVerificationMethods: [
      VerificationTier.GOVERNMENT_SIGNED,
      VerificationTier.DEVICE_ATTESTED,
    ],
  });

  console.log("Verified", verified);
  console.log("Unique identifier", uniqueIdentifier);

  // Do something with it, such as using the unique identifier to
  // identify the user in the database

  return Response.json({ verified, uniqueIdentifier });
}
