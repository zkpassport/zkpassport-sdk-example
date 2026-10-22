# ZKPassport SDK Example

This example demonstrates how to use the ZKPassport SDK for verifying passports and national IDs both for off-chain and on-chain verification.

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Running fully locally

To test circuits that are not published yet, with the verification popup and the circuits both
served from your own machine:

```
# circuits repo: package the circuits, then serve them on the LAN
npm run serve-circuits                       # http://<your ip>:8000

# packages repo, verify-popup: the popup verifies in the page against those circuits
VITE_CIRCUITS_URL=http://<your ip>:8000 bun run dev        # http://localhost:5173

# this app: open the local popup, and verify server-side against the same circuits
NEXT_PUBLIC_ZKPASSPORT_POPUP_URL=http://localhost:5173 \
ZKPASSPORT_CIRCUITS_URL=http://<your ip>:8000 npm run dev
```

The mobile app must prove with the same circuits: set the same URL under Developer options >
Local circuits URL.

## Next.js App Structure

This application uses Next.js App Router with a proper separation of server and client components:

- Server components handle static metadata and app structure
- Client components manage state, user interactions, and network communications

This architecture ensures optimal performance and SEO while still providing a rich interactive experience.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
