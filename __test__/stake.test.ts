import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
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
        fundWith: algokit.algos(100),
      },
      algod,
      kmd
    );
    const duration = BigInt(100);
    appClient = new StakeClient(
      {
        sender: testAccount,
        resolveBy: 'id',
        id: 0,
      },
      algod
    );

    await appClient.create.createApplication({ duration });
  });

  // bootstrap
  test('bootstrap', async () => {
    await appClient.appClient.fundAppAccount(algokit.microAlgos(200_000));
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
