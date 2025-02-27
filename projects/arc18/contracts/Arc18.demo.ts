import * as algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import { Arc18Client } from './clients/Arc18Client';
import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { IpfsUploader } from './ipfsUploader';
import { ALGOD_PORT, ALGOD_TOKEN, ALGOD_URL, ASSET_URL, PINATA_JWT, TXN_URL, WALLET_MNEMONIC } from './config';

// Initialize Algorand client
let algorand: AlgorandClient = AlgorandClient.fromClients({
  algod: new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_URL, ALGOD_PORT),
});

// Function to fund an account with Algos
const fund = async (address: string, amount: number) => {
  const dispenser = algosdk.mnemonicToSecretKey(WALLET_MNEMONIC);
  const suggestedParams = await algorand.client.algod.getTransactionParams().do();
  const xferTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: dispenser.addr,
    to: address,
    suggestedParams,
    amount: algokit.algos(amount).microAlgos,
  });
  const signedXferTxn = xferTxn.signTxn(dispenser.sk);
  try {
    await algorand.client.algod.sendRawTransaction(signedXferTxn).do();
    const result = await algosdk.waitForConfirmation(algorand.client.algod, xferTxn.txID().toString(), 3);
    const confirmedRound = result['confirmed-round'];
    return true;
  } catch (e: any) {
    return false;
  }
};

// Function to get detailed account balances
const getDetailedBalances = async (address: string) => {
  const r = await algorand.client.algod.accountInformation(address).do();
  const balance = algosdk.microalgosToAlgos(r['amount-without-pending-rewards']);
  const minBalance = algosdk.microalgosToAlgos(r['min-balance']);
  const deltaBalance = balance - minBalance;
  return {
    balance,
    minBalance,
    deltaBalance,
  };
};

// Function to round a number to a specific scale
const roundwithScale = (num: number, scale: number) => {
  return Math.round((num + Number.EPSILON) * 10 ** scale) / 10 ** scale;
};

(async () => {
  // Generate accounts for contract creator, admin, NFT owner, buyer, and royalty recipient
  const contract_creator = algosdk.generateAccount();
  const contract_admin = algosdk.generateAccount();
  const nft_owner = algosdk.generateAccount();
  const buyer = algosdk.generateAccount();
  const royalty_recipient = algosdk.generateAccount();

  // Fund the generated accounts
  await fund(contract_creator.addr, 10);
  await fund(contract_admin.addr, 10);
  await fund(nft_owner.addr, 10);
  await fund(buyer.addr, 10);
  await fund(royalty_recipient.addr, 1);

  // Initialize the Arc18Client
  const Caller = new Arc18Client(
    {
      resolveBy: 'id',
      id: 0,
    },
    algorand.client.algod
  );
  // Create the application
  await Caller.create.createApplication({}, { sender: contract_creator });

  // Get the application ID and address
  const { appId, appAddress } = await Caller.appClient.getAppReference();
  console.log('APP ID : ', appId);

  // Get the administrator
  var res = await Caller.getAdministrator({}, { sender: contract_creator });
  console.log(
    `
    Current Admin: ${res.return}
    Txn Hash: ${TXN_URL}${res.transaction.txID()}
    `
  );

  // Set a new administrator
  var res1 = await Caller.setAdministrator({ new_admin: contract_admin.addr }, { sender: contract_creator });
  console.log(
    `
    Changing Admin To ${contract_admin.addr}
    Txn Hash: ${TXN_URL}${res1.transaction.txID()}
    `
  );

  // Get the administrator again to confirm the change
  var res3 = await Caller.getAdministrator({}, { sender: contract_creator });
  console.log(
    `
    Current Admin: ${res3.return}
    Txn Hash: ${TXN_URL}${res3.transaction.txID()}
    `
  );

  // Set the royalty policy
  const royalty_percentage = 5;

  var res4 = await Caller.setPolicy(
    {
      royalty_basis: royalty_percentage * 100,
      royalty_receiver: royalty_recipient.addr,
    },
    { sender: contract_admin }
  );
  console.log(
    `
    Setting up Royalty Policy
    Royalty Percentage: ${royalty_percentage}
    Royalty Receiver: ${royalty_recipient.addr}
    Txn Hash: ${TXN_URL}${res4.transaction.txID()}
    `
  );

  // Get the royalty policy to confirm it was set correctly
  var res5 = await Caller.getPolicy({}, { sender: contract_admin });
  console.log(
    `
    Getting Royalty Policy
    Royalty Percentage: ${Number(res5.return?.[1]) / 100}
    Royalty Receiver: ${res5.return?.[0]}
    Txn Hash: ${TXN_URL}${res5.transaction.txID()}
    `
  );

  // Initialize IPFS uploader
  const ipfs = new IpfsUploader('pinata', {
    pinataJwt: PINATA_JWT,
  });
  // Upload NFT metadata to IPFS
  const metadata_hash = await ipfs.uploadJsonToIPFS({
    name: 'PixelTree',
    description: 'Unique, handcrafted 32x32 pixel trees',
    image: 'ipfs://bafkreibtpdn4ilchgqjv4kjtcetrahn6cyf7jjagspzjse73rkevobrceu',
    decimals: 0,
    image_integrity: 'sha256-M3jbxCxHNBNeKTMRJxAdvhYL9KQGk/KZE/uKiVcGIiU=',
    image_mimetype: 'image/png',
    properties: {
      size: 414715,
      'arc-20': {
        'application-id': appId,
      },
      'arc-18': {
        'rekey-checked': true,
      },
    },
  });
  // Create the NFT
  var suggestedParams = await algorand.client.algod.getTransactionParams().do();
  const nft_txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: nft_owner.addr,
    suggestedParams,
    defaultFrozen: true,
    unitName: 'RLT',
    assetName: 'Royalty NFT',
    manager: undefined,
    reserve: undefined,
    freeze: undefined,
    clawback: appAddress,
    assetURL: 'ipfs://' + metadata_hash + '#arc3',
    total: 1,
    decimals: 0,
  });
  const signed_nft_txn = nft_txn.signTxn(nft_owner.sk);
  await algorand.client.algod.sendRawTransaction(signed_nft_txn).do();
  const res6 = await algosdk.waitForConfirmation(algorand.client.algod, nft_txn.txID().toString(), 3);
  console.log(
    `
    Created an Arc18 Compatible NFT Using nft_owner wallet
    Asset: ${ASSET_URL}${res6['asset-index']}
    Txn Hash: ${TXN_URL}${nft_txn.txID()}
    `
  );

  // NFT owner opts-in to the application
  const res12 = await Caller.optIn.optInToApplication({}, { sender: nft_owner });
  console.log(
    `
    Made Optin To App ${appId} Using nft_owner wallet
    Txn Hash: ${TXN_URL}${res12.transaction.txID()}
    `
  );

  // Create an offer for the NFT
  const res8 = await Caller.offer(
    {
      royalty_asset: Number(res6['asset-index']),
      royalty_asset_amount: 1,
      auth_address: buyer.addr,
      offered_amount: 0,
      offered_auth_addr: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ',
    },
    { sender: nft_owner, assets: [Number(res6['asset-index'])] }
  );
  console.log(
    `
    Called offer method to give access to buyer
    Called by: ${nft_owner.addr} (nft_owner)
    Royalty Asset: ${Number(res6['asset-index'])}
    Royalty Asset Amount: ${1}
    Auth Address (Address Which has access to buy it): ${buyer.addr}
    Txn Hash: ${TXN_URL}${res8.transaction.txID()}
    `
  );

  // Get the offer details
  const res9 = await Caller.getOffer(
    { royalty_asset: Number(res6['asset-index']), from: nft_owner.addr },
    { sender: buyer, accounts: [nft_owner.addr] }
  );
  console.log(
    `
    Called get Offer
    Offer from: ${nft_owner.addr}
    Royalty Asset: ${Number(res6['asset-index'])}
    ------------------------
    Auth Address (Address Which has access to buy it): ${res9.return?.[0]}
    Royalty Asset Amount: ${res9.return?.[1]}
    Txn Hash: ${TXN_URL}${res9.transaction.txID()}
    `
  );

  // Get balances before the transfer
  const bnftOwnerBalance = await getDetailedBalances(nft_owner.addr);
  const broyaltyReciptentBalance = await getDetailedBalances(royalty_recipient.addr);
  console.log(
    `
    Before Calling transferAlgoPayment method (buy)
    NFT Owner Balance: ${roundwithScale(bnftOwnerBalance.balance, 2)}
    Royalty Wallet Balance: ${roundwithScale(broyaltyReciptentBalance.balance, 2)}
    `
  );

  // Buyer opts-in to the asset
  suggestedParams = await algorand.client.algod.getTransactionParams().do();
  const asset_optin_txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    assetIndex: Number(res6['asset-index']),
    amount: 0,
    suggestedParams,
    from: buyer.addr,
    to: buyer.addr,
  });
  const signed_asset_optin_txn = asset_optin_txn.signTxn(buyer.sk);
  await algorand.client.algod.sendRawTransaction(signed_asset_optin_txn).do();
  const res13 = await algosdk.waitForConfirmation(algorand.client.algod, asset_optin_txn.txID().toString(), 3);
  console.log(
    `
    Optin to Asset By Buyer
    Asset Id: ${Number(res6['asset-index'])}
    Buyer Address: ${buyer.addr}
    Txn Hash: ${TXN_URL}${asset_optin_txn.txID()}
    `
  );

  // Transfer Algo payment with royalty
  const amountToBePaid = 1;
  suggestedParams = await algorand.client.algod.getTransactionParams().do();
  const xferTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: buyer.addr,
    to: appAddress,
    suggestedParams,
    amount: algokit.algos(amountToBePaid).microAlgos,
  });
  const res10 = await Caller.transferAlgoPayment(
    {
      royalty_asset: Number(res6['asset-index']),
      royalty_asset_amount: 1,
      from: nft_owner.addr,
      to: buyer.addr,
      royalty_receiver: res5.return?.[0]!,
      payment: { transaction: xferTxn, signer: buyer },
      current_offer_amount: Number(res9.return?.[1]),
    },
    {
      sender: buyer,
      assets: [Number(res6['asset-index'])],
      accounts: [nft_owner.addr, res5.return?.[0]!],
      sendParams: { fee: algokit.algos(0.004) },
    }
  );
  console.log(
    `
    Called transferAlgoPayment method (buy)
    Called by: ${buyer.addr}
    Amount Transferred To Contract: ${amountToBePaid}
    Txn Hash: ${TXN_URL}${res10.transaction.txID()}
    `
  );

  // Get balances after the transfer
  const anftOwnerBalance = await getDetailedBalances(nft_owner.addr);
  const aroyaltyReciptentBalance = await getDetailedBalances(royalty_recipient.addr);
  console.log(
    `
    After Calling transferAlgoPayment method (buy)
    NFT Owner Balance: ${roundwithScale(anftOwnerBalance.balance, 2)}
    NFT Owner Balance Difference: ${roundwithScale(anftOwnerBalance.balance - bnftOwnerBalance.balance, 2)}
    Royalty Wallet Balance: ${roundwithScale(aroyaltyReciptentBalance.balance, 2)}
    Royalty Wallet Balance: ${roundwithScale(aroyaltyReciptentBalance.balance - broyaltyReciptentBalance.balance, 2)}
    `
  );

  // Get the offer again to see if it has been updated
  const res11 = await Caller.getOffer(
    { royalty_asset: Number(res6['asset-index']), from: nft_owner.addr },
    { sender: buyer, accounts: [nft_owner.addr] }
  );
  console.log(
    `
    Called get Offer
    Offer from: ${nft_owner.addr}
    Royalty Asset: ${Number(res6['asset-index'])}
    ------------------------
    Auth Address (Address Which has access to buy it): ${res11.return?.[0]}
    Royalty Asset Amount: ${res11.return?.[1]}
    Txn Hash: ${TXN_URL}${res11.transaction.txID()}
    `
  );
})();
