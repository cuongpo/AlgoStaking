/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { Stake, StakeClient } from '../contracts/DaoClient'
import { useWallet } from '@txnlab/use-wallet'

/* Example usage
<StakeAddReward
  buttonClass="btn m-2"
  buttonLoadingNode={<span className="loading loading-spinner" />}
  buttonNode="Call addReward"
  typedClient={typedClient}
  amount={amount}
/>
*/
type StakeAddRewardArgs = Dao['methods']['addReward(uint64)void']['argsObj']

type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: StakeClient
  amount: StakeAddRewardArgs['amount']
}

const StakeAddReward = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()
  const sender = { signer, addr: activeAddress! }

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling addReward`)
    await props.typedClient.addReward(
      {
        amount: props.amount,
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

export default StakeAddReward