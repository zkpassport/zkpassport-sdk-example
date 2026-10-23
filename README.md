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

## Pages

- `/` renders the button with the React component from `@zkpassport/ui/react-button`.
- `/evm` does the same for an on-chain verification.
- `/vanilla` loads the button from the CDN script (`https://cdn.zkpassport.id/ui/v0/ui.js`) and renders it with `VerifyWithZKPassport.render`, the way a page without a bundler would. To try a local build of `@zkpassport/ui` instead, copy its `dist/ui.js` into `public/` and point the page at it:

  ```
  cp ../zkpassport-packages/packages/zkpassport-ui/dist/ui.js public/ui.js
  NEXT_PUBLIC_ZKPASSPORT_UI_SCRIPT=/ui.js npm run dev
  ```

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
