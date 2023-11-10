/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { Stake, StakeClient } from '../contracts/DaoClient'
import { useWallet } from '@txnlab/use-wallet'

/* Example usage
<StakeGetUserRewardPerTokenPaid
  buttonClass="btn m-2"
  buttonLoadingNode={<span className="loading loading-spinner" />}
  buttonNode="Call getUserRewardPerTokenPaid"
  typedClient={typedClient}
  account={account}
/>
*/
type StakeGetUserRewardPerTokenPaidArgs = Dao['methods']['getUserRewardPerTokenPaid(account)uint64']['argsObj']

type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: StakeClient
  account: StakeGetUserRewardPerTokenPaidArgs['account']
}

const StakeGetUserRewardPerTokenPaid = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()
  const sender = { signer, addr: activeAddress! }

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling getUserRewardPerTokenPaid`)
    await props.typedClient.getUserRewardPerTokenPaid(
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

export default StakeGetUserRewardPerTokenPaid