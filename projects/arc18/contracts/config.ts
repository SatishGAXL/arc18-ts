import { config } from 'dotenv';
config({ path: __dirname + `/../.env` });

if (
  !process.env.ALGOD_PORT ||
  !process.env.ALGOD_URL ||
  !process.env.ALGOD_TOKEN ||
  !process.env.WALLET_MNEMONIC ||
  !process.env.TXN_URL ||
  !process.env.ASSET_URL ||
  !process.env.PINATA_JWT
) {
  throw new Error(
    'Missing environment variables. Please make sure to create a .env file in the root directory of the project and add the following variables: ALGOD_PORT, ALGOD_URL, ALGOD_TOKEN, WALLET_MNEMONIC, TXN_URL, ASSET_URL, PINATA_JWT'
  );
}

export const ALGOD_PORT = Number(process.env.ALGOD_PORT);
export const ALGOD_URL = process.env.ALGOD_URL;
export const ALGOD_TOKEN = process.env.ALGOD_TOKEN;
export const WALLET_MNEMONIC = process.env.WALLET_MNEMONIC;

export const TXN_URL = process.env.TXN_URL;
export const ASSET_URL = process.env.ASSET_URL;
export const PINATA_JWT = process.env.PINATA_JWT;
