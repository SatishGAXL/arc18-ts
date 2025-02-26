import * as algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import { Arc18Client } from './clients/Arc18Client';
import { ALGOD_PORT, ALGOD_TOKEN, ALGOD_URL, TXN_URL, WALLET_MNEMONIC } from './config';

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_URL, ALGOD_PORT);

const sender = algosdk.mnemonicToSecretKey(WALLET_MNEMONIC);

(async () => {
  const Caller = new Arc18Client(
    {
      sender,
      resolveBy: 'id',
      id: 0,
    },
    algodClient
  );

  await Caller.create.createApplication({});

  const { appId, appAddress } = await Caller.appClient.getAppReference();
  console.log('APP ID : ', appId);

  const royalty_percentage = 5;

  var res = await Caller.setPolicy(
    {
      royalty_basis: royalty_percentage * 100,
      royalty_receiver: sender.addr,
    },
    { sender: sender }
  );
  console.log(
    `
    Setting up Royalty Policy
    Royalty Percentage: ${royalty_percentage}
    Royalty Receiver: ${sender.addr}
    Txn Hash: ${TXN_URL}${res.transaction.txID()}
    `
  );
})();
