/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { Stake, StakeClient } from '../contracts/DaoClient'
import { useWallet } from '@txnlab/use-wallet'

/* Example usage
<StakeGetReward
  buttonClass="btn m-2"
  buttonLoadingNode={<span className="loading loading-spinner" />}
  buttonNode="Call getReward"
  typedClient={typedClient}
  stakingToken={stakingToken}
/>
*/
type StakeGetRewardArgs = Dao['methods']['getReward(asset)void']['argsObj']

type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: StakeClient
  stakingToken: StakeGetRewardArgs['stakingToken']
}

const StakeGetReward = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()
  const sender = { signer, addr: activeAddress! }

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling getReward`)
    await props.typedClient.getReward(
      {
        stakingToken: props.stakingToken,
      },
      { sender },
    )
    setLoading(false)
  }

  return (
    <button className={props.buttonClass} onClick={callMethod}>
      {loading ? props.buttonLoadingNode || props.buttonNode : props.buttonNode}
    </button>
  )
}

export default StakeGetReward