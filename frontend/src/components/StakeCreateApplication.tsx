/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { Stake, StakeClient } from '../contracts/DaoClient'
import { useWallet } from '@txnlab/use-wallet'

/* Example usage
<StakeCreateApplication
  buttonClass="btn m-2"
  buttonLoadingNode={<span className="loading loading-spinner" />}
  buttonNode="Call createApplication"
  typedClient={typedClient}
  duration={duration}
/>
*/
type StakeCreateApplicationArgs = Dao['methods']['createApplication(uint64)void']['argsObj']

type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: StakeClient
  duration: StakeCreateApplicationArgs['duration']
  setAppID: (appID: number) => void
}

const StakeCreateApplication = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [duration, setDuration] = useState<number>()
  const { activeAddress, signer } = useWallet()
  const sender = { signer, addr: activeAddress! }

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling createApplication`)
    await props.typedClient.create.createApplication(
      {
        duration,
      },
      { sender },
    );

    const {appId} = await props.typedClient.appClient.getAppReference();

    props.setAppID(Number(appId));
    setLoading(false)
  }

  return (
    <div>
      <input type="text" className="input input-bordered m-2" onChange={(e) => {
        const inputValue = e.currentTarget.value;
        const numericValue = inputValue !== '' ? parseFloat(inputValue) : undefined;
        setDuration(numericValue);
      }} />

      <button className={props.buttonClass} onClick={callMethod}>
        {loading ? props.buttonLoadingNode || props.buttonNode : props.buttonNode}
      </button>
    </div>
  )
}

export default StakeCreateApplication