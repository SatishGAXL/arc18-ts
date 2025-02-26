# ARC18 Implementation in TypeScript

This project implements the ARC18 standard for royalty specification in Algorand NFT trading. ARC18 provides a standardized way to handle royalty payments for NFT transactions on the Algorand blockchain.

## Overview

ARC18 allows NFT creators to:
- Set royalty policies for their assets
- Define royalty recipients
- Specify royalty percentages
- Enable secure trading with automatic royalty distribution

## Features

- **Smart Contract Implementation**: Complete ARC18 specification implementation in TEALScript
- **Royalty Management**: Set and manage royalty policies with customizable percentages
- **Asset Trading**: Secure NFT trading with automatic royalty distribution
- **IPFS Integration**: Built-in support for NFT metadata storage using IPFS (via NFT.Storage or Pinata)
- **Administrative Controls**: Role-based access control for contract administration

## Prerequisites

- Node.js
- Algorand Node (Local or TestNet access)
- IPFS Storage Account (Pinata or NFT.Storage)

## Setup

1. Clone the repository
```bash
git clone https://github.com/SatishGAXL/read-write.git
cd read-write/projects/read-write
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables by copying `.env.sample` to `.env`:
```bash
cp .env.sample .env
```

4. Update `.env` with your credentials:
```properties
WALLET_MNEMONIC="your_wallet_mnemonic"
ALGOD_TOKEN="your_algod_token"
ALGOD_URL="your_algod_url"
ALGOD_PORT=your_algod_port
TXN_URL="your_transaction_explorer_url"
ASSET_URL="your_asset_explorer_url"
PINATA_JWT="your_pinata_jwt"
```

## Usage

### Deployment

Deploy the ARC18 contract using:

```bash
npm run deploy
```

Example output:
```
APP ID: 1002

Setting up Royalty Policy
Royalty Percentage: 5
Royalty Receiver: TIIHSF...M6IH6A
```

### Demo

Run the demo script to see the complete workflow:

```bash
npm run demo
```

The demo script showcases:
1. Contract deployment
2. Administrator management
3. Royalty policy setup
4. NFT creation with ARC18 compliance
5. NFT offering and trading
6. Automatic royalty distribution

## Core Components

### Smart Contract (`Arc18.algo.ts`)
- Implements the ARC18 specification
- Handles royalty calculations and distributions
- Manages asset transfers and offers

### IPFS Uploader (`ipfsUploader.ts`)
- Handles NFT metadata and image storage
- Supports multiple IPFS providers (NFT.Storage, Pinata)
- Manages CID generation and retrieval

### Deployment Script (`Arc18.deploy.ts`)
- Deploys the ARC18 contract
- Sets initial administrator
- Configures royalty policies

### Demo Script (`Arc18.demo.ts`)
- Demonstrates complete workflow
- Creates and trades NFTs
- Shows royalty distribution

## Key Functions

- `setPolicy`: Configure royalty percentage and recipient
- `offer`: Create NFT sale offers
- `transferAlgoPayment`: Execute NFT purchases with automatic royalty distribution
- `getPolicy`: Retrieve current royalty policy
- `getOffer`: Get details of active offers

## Development

For local development:
1. Use LocalNet configuration in `.env`
2. Deploy contract using deployment script
3. Test functionality using demo script
4. Monitor transactions using provided explorer URLs