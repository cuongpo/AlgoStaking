import { DeflyWalletConnect } from '@blockshake/defly-connect'
import { DaffiWalletConnect } from '@daffiwallet/connect'
import { PeraWalletConnect } from '@perawallet/connect'
import { PROVIDER_ID, ProvidersArray, WalletProvider, useInitializeProviders, useWallet } from '@txnlab/use-wallet'
import algosdk from 'algosdk'
import { SnackbarProvider } from 'notistack'
import { useState, useEffect } from 'react'
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
import StakeCreateApplication from './components/StakeCreateApplication'
import StakeGetBalanceData from './components/StakeGetBalanceData'
import StakeGetRewardData from './components/StakeGetRewardData'
import StakeStake from './components/StakeStake'

import StakeFaucet  from './components/StakeFaucet'
import {StakeClient} from "./contracts/StakeClient"
import * as algokit from '@algorandfoundation/algokit-utils'
import { Asset } from 'algosdk/dist/types/client/v2/algod/models/types'
let providersArray: ProvidersArray
if (import.meta.env.VITE_ALGOD_NETWORK === '') {
  const kmdConfig = getKmdConfigFromViteEnvironment()
  providersArray = [
    {
      id: PROVIDER_ID.KMD,
      clientOptions: {
        wallet: kmdConfig.wallet,
        password: kmdConfig.password,
        host: kmdConfig.server,
        token: String(kmdConfig.token),
        port: String(kmdConfig.port),
      },
    },
  ]
} else {
  providersArray = [
    { id: PROVIDER_ID.DEFLY, clientStatic: DeflyWalletConnect },
    { id: PROVIDER_ID.PERA, clientStatic: PeraWalletConnect },
    { id: PROVIDER_ID.DAFFI, clientStatic: DaffiWalletConnect },
    { id: PROVIDER_ID.EXODUS },
    // If you are interested in WalletConnect v2 provider
    // refer to https://github.com/TxnLab/use-wallet for detailed integration instructions
  ]
}

export default function App() {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openDemoModal, setOpenDemoModal] = useState<boolean>(false)
  const [totalReward, setTotalReward] = useState<number>(0)
  const [totalStaked, setTotalStaked] = useState<number>(0)
  const [rewardRate, setRewardRate] = useState<number>(0)
  const { activeAddress } = useWallet()
  const stakingToken = 1016;
  const appID = 1012;
  const setState = async () => {
    try {
      const state = await typedClient.getGlobalState()
      setTotalStaked(state.totalSupply!.asNumber)
      setRewardRate(state.rewardRate!.asNumber)
      setTotalReward(state.totalReward!.asNumber)
    } catch(e) {
      console.log(e);
    }
  }

  useEffect(() => {
    setState()
  }, [appID])


  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algodClient = algokit.getAlgoClient({
    server: algodConfig.server,
    port: algodConfig.port,
    token: algodConfig.token
  })
  const typedClient = new StakeClient(
    {
      resolveBy: 'id',
      id: appID,
    },
    algodClient,
  )

  const walletProviders = useInitializeProviders({
    providers: providersArray,
    nodeConfig: {
      network: algodConfig.network,
      nodeServer: algodConfig.server,
      nodePort: String(algodConfig.port),
      nodeToken: String(algodConfig.token),
    },
    algosdkStatic: algosdk,
  })

  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider value={walletProviders}>
        <div className="hero min-h-screen bg-teal-400">
          <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white mx-auto">
            <div className="max-w-md">
              <h1 className="text-4xl">
                Welcome to <div className="font-bold">AlgoStaking 🙂</div>
              </h1>
              <p className="py-6"> This is frontend for AlgoStaking.</p>

              <div className="grid">
                <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
                  Wallet Connection
                </button>
                <div className="divider" />
                <h1 className="font-bold m-2">Total Reward</h1>
                <textarea className="textarea textarea-bordered m-2"  value={totalReward} />
                <h1 className="font-bold m-2">Total Staked</h1>
                <textarea className="textarea textarea-bordered m-2"  value={totalStaked} />
                <h1 className="font-bold m-2">Reward Rate</h1>
                <textarea className="textarea textarea-bordered m-2"  value={rewardRate} />
    
                <div className="divider" />
                <h1 className="font-bold m-2">My Staked</h1>
                <StakeGetBalanceData
                  buttonClass="btn m-2"
                  buttonLoadingNode={<span className="loading loading-spinner" />}
                  buttonNode="Call getBalanceData"
                  typedClient={typedClient}
                  account={activeAddress}
                />
                <h1 className="font-bold m-2">My Reward</h1>
                <StakeGetRewardData
                  buttonClass="btn m-2"
                  buttonLoadingNode={<span className="loading loading-spinner" />}
                  buttonNode="Call getRewardData"
                  typedClient={typedClient}
                  account={activeAddress}
                />
              </div>
              
              <div className="divider" />
              {activeAddress && appID !==0 && (
                <StakeFaucet
                  buttonClass="btn m-2"
                  buttonLoadingNode={<span className="loading loading-spinner" />}
                  buttonNode="Call faucet"
                  typedClient={typedClient}
                  stakingToken={stakingToken}
                  algodClient={algodClient}
                />
              )}

              <div className="divider" />
              <StakeStake
                buttonClass="btn m-2"
                buttonLoadingNode={<span className="loading loading-spinner" />}
                buttonNode="Call stake"
                typedClient={typedClient}
                axfer={}
                stakingToken={stakingToken}
              />
              <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
              <Transact openModal={openDemoModal} setModalState={setOpenDemoModal} />
            </div>
          </div>
        </div>
      </WalletProvider>
    </SnackbarProvider>
  )
}
