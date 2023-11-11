/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { Stake, StakeClient } from '../contracts/DaoClient'
import { useWallet } from '@txnlab/use-wallet'
import algosdk from 'algosdk'
import * as algokit from '@algorandfoundation/algokit-utils'

/* Example usage
<StakeFaucet
  buttonClass="btn m-2"
  buttonLoadingNode={<span className="loading loading-spinner" />}
  buttonNode="Call faucet"
  typedClient={typedClient}
  stakingToken={stakingToken}
/>
*/
type StakeFaucetArgs = Dao['methods']['faucet(asset)void']['argsObj']

type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: StakeClient
  stakingToken: StakeFaucetArgs['stakingToken']
  algodClient: algosdk.Algodv2

}

const StakeFaucet = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()
  const sender = { signer, addr: activeAddress! }

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling faucet`)

    const stakingTokenOptInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: sender.addr,
      to: sender.addr,
      amount: 0,
      suggestedParams: await algokit.getTransactionParams(undefined, props.algodClient),
      assetIndex: Number(props.stakingToken),
    })

    await algokit.sendTransaction(
      {
        from: sender,
        transaction: stakingTokenOptInTxn,
      },
      props.algodClient,
    )
    console.log(props.stakingToken)
    await props.typedClient.faucet(
      { 
        stakingToken: props.stakingToken,
      },
      {
        sender, 
        boxes: [algosdk.decodeAddress(sender.addr).publicKey],
        sendParams: {
          fee: algokit.microAlgos(3_000),
        },
      },
    )

 
    setLoading(false)
  }

  return (
    <button className={props.buttonClass} onClick={callMethod}>
      {loading ? props.buttonLoadingNode || props.buttonNode : props.buttonNode}
    </button>
  )
}

export default StakeFaucet
