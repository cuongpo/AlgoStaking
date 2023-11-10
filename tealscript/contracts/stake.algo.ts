/* eslint-disable prettier/prettier */
import { Contract } from '@algorandfoundation/tealscript';

type accData = {balance: uint64, userRewardPerTokenPaid: uint64, rewards: uint64};
// eslint-disable-next-line no-unused-vars
class Stake extends Contract {
  stakingToken = GlobalStateKey<Asset>();

  duration = GlobalStateKey<uint64>();

  finishAt = GlobalStateKey<uint64>();

  updatedAt = GlobalStateKey<uint64>();

  rewardRate = GlobalStateKey<uint64>();

  rewardPerTokenStored = GlobalStateKey<uint64>();

  totalSupply = GlobalStateKey<uint64>();

  accData = BoxMap<Account, accData>({ });

  // mint Token
  bootstrap(): Asset {
    verifyTxn(this.txn, { sender: this.app.creator });
    const stakingToken = sendAssetCreation({
      configAssetTotal: 10000,
    });

    this.stakingToken.value = stakingToken;
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
    };
    this.accData(this.txn.sender).value = acc;

  }

  getStakingToken(): Asset {
    return this.stakingToken.value;
  }

  createApplication(duration: uint64): void {
    this.duration.value = duration;
  }

  lastTimeRewardApplicable(): uint64 {
    if (globals.latestTimestamp <= this.finishAt.value) {
      return globals.latestTimestamp;
    }
    return this.finishAt.value;
  }

  rewardPerToken(): uint64 {
    if (this.totalSupply.value === 0) {
      return this.rewardPerTokenStored.value;
    }

    return (
      this.rewardPerTokenStored.value +
      (this.rewardRate.value * (this.lastTimeRewardApplicable() - this.updatedAt.value) * 1000000000000000000) /
        this.totalSupply.value
    );
  }

  earned(account: Address): uint64 {
    return (
      (this.accData(account).value.balance * (this.rewardPerToken() - this.accData(account).value.userRewardPerTokenPaid)) /
        1000000000000000000 +
      this.accData(account).value.rewards
    );
  }

  private updateReward(account: Address): void {
    this.rewardPerTokenStored.value = this.rewardPerToken();
    this.updatedAt.value = this.lastTimeRewardApplicable();
    this.accData(account).value.rewards = this.earned(account);
    this.accData(account).value.userRewardPerTokenPaid = this.rewardPerTokenStored.value;
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

  withdraw(amount: uint64): void {
    assert(amount > 0);
    assert(this.accData(this.txn.sender).value.balance > amount);
    this.accData(this.txn.sender).value.balance = this.accData(this.txn.sender).value.balance - amount;
    this.totalSupply.value = this.totalSupply.value - amount;
    sendAssetTransfer({
      xferAsset: this.stakingToken.value,
      assetReceiver: this.txn.sender,
      assetAmount: amount,
    });
    this.updateReward(this.txn.sender);
  }

  getReward(): void {
    const reward = this.accData(this.txn.sender).value.rewards;
    if (reward > 0) {
      this.accData(this.txn.sender).value.rewards = 0;
      sendAssetTransfer({
        xferAsset: this.stakingToken.value,
        assetReceiver: this.txn.sender,
        assetAmount: reward,
      });
    }
  }

  setRewardsDuration(duration: uint64): void {
    assert(this.txn.sender === this.app.creator);
    assert(globals.latestTimestamp > this.finishAt.value);
    this.duration.value = duration;
  }

  notifyRewardAmount(amount: uint64): void {
    verifyTxn(this.txn, { sender: this.app.creator });
    if (globals.latestTimestamp >= this.finishAt.value) {
      this.rewardRate.value = amount / this.duration.value;
    } else {
      this.rewardRate.value =
        (amount + this.rewardRate.value * (this.finishAt.value - globals.latestTimestamp)) / this.duration.value;
    }
    assert(this.rewardRate.value > 0);
    // Reward Amount > Balance
    this.updatedAt.value = globals.latestTimestamp;
    this.finishAt.value = globals.latestTimestamp + this.duration.value;
  }

  getRewardData(account: Account): uint64 {
    return this.accData(account).value.rewards;
  }

  getBalanceData(account: Account): uint64 {
    return this.accData(account).value.balance;
  }

  getUserRewardPerTokenPaid(account: Account): uint64 {
    return this.accData(account).value.userRewardPerTokenPaid;
  }
}