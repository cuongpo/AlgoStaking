/* eslint-disable prettier/prettier */
import { Contract } from '@algorandfoundation/tealscript';

type accData = {balance: number, userRewardPerTokenPaid: number, rewards: number ,earned: number};
// eslint-disable-next-line no-unused-vars
class Stake extends Contract {
  stakingToken = GlobalStateKey<Asset>();

  // Duration of rewards to be paid out (in seconds)
  duration = GlobalStateKey<uint64>();

  // Timestamp of when the rewards finish
  finishAt = GlobalStateKey<uint64>();

  // Minimum of last updated time and reward finish time
  updatedAt = GlobalStateKey<uint64>();

   // Reward to be paid out per second
  rewardRate = GlobalStateKey<uint64>();

  lastTimeReward = GlobalStateKey<uint64>();

   // Sum of (reward rate * dt * 1e18 / total supply)s
  rewardPerTokenStored = GlobalStateKey<uint64>();

  totalSupply = GlobalStateKey<uint64>();

  accData = BoxMap<Address, accData>({ });

  // mint Token
  bootstrap(): Asset {
    verifyTxn(this.txn, { sender: this.app.creator });
    const stakingToken = sendAssetCreation({
      configAssetTotal: 100000000,
    });

    this.stakingToken.value = stakingToken;
    this.totalSupply.value = 1;
    this.rewardRate.value = 1;
    this.finishAt.value= 0;
    this.rewardPerTokenStored.value =0;
    return stakingToken;
  }

  faucet(stakingToken: Asset): void {
    sendAssetTransfer({
      xferAsset: this.stakingToken.value,
      assetReceiver: this.txn.sender,
      assetAmount: 1,
    });
    const acc: accData = {
      balance: 0,
      rewards: 0,
      userRewardPerTokenPaid: 0,
      earned: 0,
    };
    this.accData(this.txn.sender).value = acc;

  }

  getStakingToken(): Asset {
    return this.stakingToken.value;
  }

  createApplication(duration: uint64): Address {
    this.duration.value = duration;
    return this.app.address;
  }

  lastTimeRewardApplicable(): uint64 {
    this.lastTimeReward.value = globals.latestTimestamp;
    return this.lastTimeReward.value
  }

  rewardPerToken(): uint64 {
    this.lastTimeRewardApplicable();
    if (this.totalSupply.value === 0) {
      return this.rewardPerTokenStored.value;
    }
    this.rewardPerTokenStored.value = this.rewardPerTokenStored.value + this.rewardRate.value*1000*(this.lastTimeReward.value - this.updatedAt.value)/this.totalSupply.value;
    return  this.rewardPerTokenStored.value;
  }

  earned(account: Address): uint64 {
    this.accData(account).value.earned = (
      (this.accData(account).value.balance * (this.rewardPerTokenStored.value - this.accData(account).value.userRewardPerTokenPaid))
      +
      this.accData(account).value.rewards
    );
    return this.accData(account).value.earned;
  }

  updateReward(account: Address): uint64 {
    this.rewardPerToken();
    this.updatedAt.value = this.lastTimeReward.value;
    this.earned(account);
    this.accData(account).value.rewards = this.accData(account).value.earned;
    this.accData(account).value.userRewardPerTokenPaid = this.rewardPerTokenStored.value;
    return this.accData(account).value.rewards;
  }

  appOptedinAsset(stakingToken: Asset): void {
    sendAssetTransfer({
      xferAsset: this.stakingToken.value,
      assetReceiver: this.app.address,
      assetAmount: 0,
    });
  }

  stake(axfer: AssetTransferTxn, stakingToken: Asset): void {
    /// Verify axfer
    verifyTxn(axfer, { assetReceiver: this.app.address });
    this.accData(this.txn.sender).value.balance = this.accData(this.txn.sender).value.balance + axfer.assetAmount;

    this.totalSupply.value = this.totalSupply.value + axfer.assetAmount;

    this.updateReward(this.txn.sender);
  }

  withdraw(amount: uint64, stakingToken: Asset): void {
    assert(amount > 0);
    assert(this.accData(this.txn.sender).value.balance >= amount);
    this.accData(this.txn.sender).value.balance = this.accData(this.txn.sender).value.balance - amount;
    this.totalSupply.value = this.totalSupply.value - amount;
    sendAssetTransfer({
      xferAsset: this.stakingToken.value,
      assetReceiver: this.txn.sender,
      assetAmount: amount,
    });
    this.updateReward(this.txn.sender);
  }

  getReward(stakingToken: Asset): void {
    const reward = this.accData(this.txn.sender).value.rewards;
    if (reward > 0) {
      
      sendAssetTransfer({
        xferAsset: this.stakingToken.value,
        assetReceiver: this.txn.sender,
        assetAmount: reward/1000,
      });
      this.accData(this.txn.sender).value.rewards = 0;
    }
  }

  setRewardsDuration(duration: uint64): void {
    assert(this.txn.sender === this.app.creator);
    assert(globals.latestTimestamp > this.finishAt.value);
    this.duration.value = duration;
  }

  addReward(amount: uint64): void {
    // verifyTxn(this.txn, { sender: this.app.creator });
    if (globals.latestTimestamp >= this.finishAt.value) {
      this.rewardRate.value = amount / this.duration.value;
    } else {
      this.rewardRate.value =
        (amount + this.rewardRate.value * (this.finishAt.value - globals.latestTimestamp)) / this.duration.value;
    }
    // assert(this.rewardRate.value > 0);
    // Reward Amount > Balance
    this.updatedAt.value = globals.latestTimestamp;
    this.finishAt.value = globals.latestTimestamp + this.duration.value;

  }

  getBalanceData(account: Account): uint64 {
    return this.accData(account).value.balance;
  }

  getUserRewardPerTokenPaid(account: Account): uint64 {
    return this.accData(account).value.userRewardPerTokenPaid;
  }

  getTotalSupply(): uint64 {
    return this.totalSupply.value;
  }
}
