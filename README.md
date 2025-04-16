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

## Network Configuration

This application supports both Sepolia testnet and a local Anvil network for development. Users can select which network to use directly in the UI, and their preference will be saved between sessions.

For the contract addresses, update the following environment variables in your `.env.local` file:

```
# Contract addresses
NEXT_PUBLIC_SEPOLIA_VERIFIER_ADDRESS=0x...
NEXT_PUBLIC_LOCAL_VERIFIER_ADDRESS=0x...
```

The application uses public RPC endpoints to interact with the blockchain, so no wallet connection is required for verifying proofs.

### Using Local Anvil

To use a local Anvil instance:

1. Install Foundry:

   ```
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. Start Anvil in a separate terminal:

   ```
   anvil
   ```

3. Deploy your contract to the local Anvil instance:

   ```
   forge script scripts/DeployVerifier.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
   ```

4. Update your `.env.local` file with the deployed contract address

5. Restart the development server

## Using the Application

1. Open the application in your browser (http://localhost:3000)
2. Select your preferred network using the dropdown menu
3. Click "Generate new request" to create a new verification request
4. Scan the QR code with the ZKPassport mobile app
5. The verification results will be displayed on screen, including on-chain verification without requiring a wallet connection

## Next.js App Structure

This application uses Next.js App Router with a proper separation of server and client components:

- Server components handle static metadata and app structure
- Client components manage state, user interactions, and network communications

This architecture ensures optimal performance and SEO while still providing a rich interactive experience.

## Network Selection

The application allows users to select between different networks (Sepolia testnet or local Anvil) using a dropdown menu in the interface. This eliminates the need to modify environment variables to switch networks. The application will store the user's network preference in local storage for future sessions.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Inter, a Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
