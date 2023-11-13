/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { Stake, StakeClient } from '../contracts/DaoClient'
import { useWallet } from '@txnlab/use-wallet'

/* Example usage
<StakeUpdateReward
  buttonClass="btn m-2"
  buttonLoadingNode={<span className="loading loading-spinner" />}
  buttonNode="Call updateReward"
  typedClient={typedClient}
  account={account}
/>
*/
type StakeUpdateRewardArgs = Dao['methods']['updateReward(address)uint64']['argsObj']

type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: StakeClient
  account: StakeUpdateRewardArgs['account']
}

const StakeUpdateReward = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()
  const sender = { signer, addr: activeAddress! }

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling updateReward`)
    await props.typedClient.updateReward(
      {
        account: props.account,
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

export default StakeUpdateReward