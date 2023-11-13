import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture, getTestAccount } from '@algorandfoundation/algokit-utils/testing';
import * as algokit from '@algorandfoundation/algokit-utils';
import algosdk, { Kmd } from 'algosdk';
import { StakeClient } from '../contracts/clients/StakeClient';

const fixture = algorandFixture();

let appClient: StakeClient;

describe('Stake', () => {
  let sender: algosdk.Account;
  let stakingToken: bigint;
  beforeEach(fixture.beforeEach);

  beforeAll(async () => {
    await fixture.beforeEach();

    const { algod, testAccount, kmd } = fixture.context;

    sender = await algokit.getOrCreateKmdWalletAccount(
      {
        name: 'abc',
        fundWith: algokit.algos(500), 
      },
      algod,
      kmd
    );
    const duration = BigInt(2592000); // 24*60*60*30
    appClient = new StakeClient(
      {
        sender: testAccount,
        resolveBy: 'id',
        id: 0,
      },
      algod
    );

    await appClient.create.createApplication({ duration });
    const text = 'p-';
    const addressBytes = new TextEncoder().encode('ZVYWEVBGF6JH6FHTXKCNIMN6NPDRURKFVJZ7OPURL2WS7C7KLDQF2AP4V4');
    const combinedArray = new Uint8Array(text.length + addressBytes.length);

    // Copy the text and addressBytes into combinedArray
    combinedArray.set(new TextEncoder().encode(text), 0);
    combinedArray.set(addressBytes, text.length);

    const boxRef = combinedArray;

    console.log(stakingToken);
    console.log(boxRef);
  });

  // bootstrap
  test('bootstrap', async () => {
    await appClient.appClient.fundAppAccount(algokit.microAlgos(500_000));
    const bootstrapResult = await appClient.bootstrap(
      {},
      {
        sendParams: {
          fee: algokit.microAlgos(2000),
        },
      }
    );

    stakingToken = bootstrapResult.return!.valueOf();
    console.log(stakingToken);
  });
});
