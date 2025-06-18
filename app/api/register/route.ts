import { QueryResult, ZKPassport } from "@zkpassport/sdk";

import { ProofResult } from "@zkpassport/sdk";

export const config = {
  runtime: "edge",
};

export async function POST(request: Request) {
  const {
    queryResult,
    proofs,
    domain,
  }: {
    queryResult: QueryResult;
    proofs: ProofResult[];
    domain: string;
  } = await request.json();

  const zkpassport = new ZKPassport(domain);

  const { verified, uniqueIdentifier } = await zkpassport.verify({
    proofs,
    queryResult,
    devMode: true,
  });

  console.log("Verified", verified);
  console.log("Unique identifier", uniqueIdentifier);

  // Do something with it, such as using the unique identifier to
  // identify the user in the database

  return Response.json({ registered: verified });
}
