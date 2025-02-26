# ARC18 Implementation in Tealscript

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
git clone https://github.com/SatishGAXL/arc18-ts.git
cd arc18-ts/projects/arc18
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

### Start Algokit Environment (Optional)

Start Docker & Run this command to start Localnet (If using Localnet Configuration in .env):

```bash
algokit localnet reset
```

### Compilation (Optional)

Compile ARC18 contract using:

```bash
npm run build
```

### Deployment

Deploy the ARC18 contract using:

```bash
npx tsx .\contracts\Arc18.deploy.ts
```

Example output:
```
APP ID :  1002

    Setting up Royalty Policy
    Royalty Percentage: 5
    Royalty Receiver: TIIHSFUUBHLWSSX5HEWIZS2Y2ZD65743KPFGJXCM5WA6EJPYCEXYM6IH6A
    Txn Hash: https://lora.algokit.io/localnet/transaction/5UJGEP27IGN5GTSS555K3DUJOJ6VKJLQSZ4HZDHTOFWT6NSD6EOA
```

### Demo

Run the demo script to see the complete workflow:

```bash
npx tsx .\contracts\Arc18.demo.ts
```

Example Output:
```
Created app 1009 from creator JMETMUN6QCV55IQTTPQQPUR3RNDIPGYUHGBAVE4JV6VFFL3GKHCXHGREPM
APP ID :  1009

    Current Admin: JMETMUN6QCV55IQTTPQQPUR3RNDIPGYUHGBAVE4JV6VFFL3GKHCXHGREPM
    Txn Hash: https://lora.algokit.io/localnet/transaction/XSGESFHKAJTFFDSJ2L4WDQYD2NU3UMW42XOHI4ZVCBSNVBAYHCHA


    Changing Admin To PW5GZWX233KA6IQA23YZBDCCSUWEZREQF4XFAKEAWFGTWBTW7XIVR4SGIA
    Txn Hash: https://lora.algokit.io/localnet/transaction/XWRR6VTRUXLNV5XNSKAR6ET3V2WISI3NNAHI46OFP7I5KZQ5SFNA


    Current Admin: PW5GZWX233KA6IQA23YZBDCCSUWEZREQF4XFAKEAWFGTWBTW7XIVR4SGIA
    Txn Hash: https://lora.algokit.io/localnet/transaction/2BUNEJYHIIZSKQUZEIF6FL5WAFYQZQNVZFLSOE3YFK4FKBSZ3FMQ


    Setting up Royalty Policy
    Royalty Percentage: 5
    Royalty Receiver: 6YFXX2DUB7PD3IZHGBZJSMI5IYUHL3JUNFWWNCSX3XMEKFHJFM36IJJTIE
    Txn Hash: https://lora.algokit.io/localnet/transaction/QUYYWXMBPBYBS5HXPWEWPFJYD5UNTVYVO7RGPNFOCKBAFBQH2QVQ


    Getting Royalty Policy
    Royalty Percentage: 5
    Royalty Receiver: 6YFXX2DUB7PD3IZHGBZJSMI5IYUHL3JUNFWWNCSX3XMEKFHJFM36IJJTIE
    Txn Hash: https://lora.algokit.io/localnet/transaction/TLOS6GUXTZNS5EYQV4FADUDDHX4KBI2BFRLRJNGR7VL4GUZ6FCRQ


    Created an Arc18 Compatible NFT Using nft_owner wallet
    Asset: https://lora.algokit.io/localnet/asset/1015
    Txn Hash: https://lora.algokit.io/localnet/transaction/2NXAQS3XJ2GJS6OFMTAWFVS5O2SB6MTPOQZ5BAG4VI677UACBVFA


    Made Optin To App 1009 Using nft_owner wallet
    Txn Hash: https://lora.algokit.io/localnet/transaction/WQHOFZWELSXK7RWR7QKPWOM6LI4EL62GBMPECLBNQNIXX3ROAH2A


    Called offer method to give access to buyer
    Called by: G3AEJDAUOOPGMVLWA6HIPY57VM6OKAIAIKAREPW5G4WH4J67WW7SMF4JQI (nft_owner)
    Royalty Asset: 1015
    Royalty Asset Amount: 1
    Auth Address (Address Which has access to buy it): LUS7DDTNJZ6HTA4GS7ZGO6L3IH2KXJGIXDCJKVHHMKJAT3KWT5RZP2H3QU
    Txn Hash: https://lora.algokit.io/localnet/transaction/O5L4ZJBNQ5JDX3NLJPHUJE6NWPH4L5S2JAGA4AOEYBP4YZCYE3EA


    Called get Offer
    Offer from: G3AEJDAUOOPGMVLWA6HIPY57VM6OKAIAIKAREPW5G4WH4J67WW7SMF4JQI
    Royalty Asset: 1015
    ------------------------
    Auth Address (Address Which has access to buy it): LUS7DDTNJZ6HTA4GS7ZGO6L3IH2KXJGIXDCJKVHHMKJAT3KWT5RZP2H3QU
    Royalty Asset Amount: 1
    Txn Hash: https://lora.algokit.io/localnet/transaction/HRHETODHWG3XNSQH4ORDILALM2BZMC3VAFHQK76QGRKTCR2WUJAA


    Before Calling transferAlgoPayment method (buy)
    NFT Owner Balance: 10
    Royalty Wallet Balance: 1


    Optin to Asset By Buyer
    Asset Id: 1015
    Buyer Address: LUS7DDTNJZ6HTA4GS7ZGO6L3IH2KXJGIXDCJKVHHMKJAT3KWT5RZP2H3QU
    Txn Hash: https://lora.algokit.io/localnet/transaction/25RUGKYJZFJMG3HQ2BFXSAV7APGOPYTSM5XQCUESX7KDHY3NFDSA

    Transaction IDs (CmURT0EPM3jYf/uu8T+p2HB3qISK7MHsi/j8OqaePFk=) [
      '2HNXMHT2TL3ZRMLPNJDVBHB2TT3T74JYKJCILLO52DLY4KULKIKQ',
      '6QRDNZQYWMVERZ4EXESSILAYVZHXMERURDJKCLL2BOXORCZ5FCOQ'
    ]

    Called transferAlgoPayment method (buy)
    Called by: LUS7DDTNJZ6HTA4GS7ZGO6L3IH2KXJGIXDCJKVHHMKJAT3KWT5RZP2H3QU
    Amount Transferred To Contract: 1
    Txn Hash: https://lora.algokit.io/localnet/transaction/6QRDNZQYWMVERZ4EXESSILAYVZHXMERURDJKCLL2BOXORCZ5FCOQ


    After Calling transferAlgoPayment method (buy)
    NFT Owner Balance: 10.95
    NFT Owner Balance Difference: 0.95
    Royalty Wallet Balance: 1.05
    Royalty Wallet Balance: 0.05


    Called get Offer
    Offer from: G3AEJDAUOOPGMVLWA6HIPY57VM6OKAIAIKAREPW5G4WH4J67WW7SMF4JQI
    Royalty Asset: 1015
    ------------------------
    Auth Address (Address Which has access to buy it): LUS7DDTNJZ6HTA4GS7ZGO6L3IH2KXJGIXDCJKVHHMKJAT3KWT5RZP2H3QU
    Royalty Asset Amount: 0
    Txn Hash: https://lora.algokit.io/localnet/transaction/MDX6UHKGEVPVCFKF6XYEDY7EXJNOI2E44WDDLP3FSIJAYELVRVLA

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
