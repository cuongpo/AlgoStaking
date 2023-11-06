import { Contract } from '@algorandfoundation/tealscript';

// eslint-disable-next-line no-unused-vars
class Stake extends Contract {
  stakingToken = GlobalStateKey<Asset>();

  duration = GlobalStateKey<uint64>();

  finishAt = GlobalStateKey<uint64>();

  updatedAt = GlobalStateKey<uint64>();

  rewardRate = GlobalStateKey<uint64>();

  rewardPerTokenStored = GlobalStateKey<uint64>();

  userRewardPerTokenPaid = BoxMap<Address, uint64>();

  rewards = BoxMap<Address, uint64>({ prefix: 'r' });

  totalSupply = GlobalStateKey<uint64>();

  balanceOf = BoxMap<Address, uint64>({ prefix: 'b' });

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
      (this.balanceOf(account).value * (this.rewardPerToken() - this.userRewardPerTokenPaid(account).value)) /
        1000000000000000000 +
      this.rewards(account).value
    );
  }

  private updateReward(account: Address): void {
    this.rewardPerTokenStored.value = this.rewardPerToken();
    this.updatedAt.value = this.lastTimeRewardApplicable();
    this.rewards(account).value = this.earned(account);
    this.userRewardPerTokenPaid(account).value = this.rewardPerTokenStored.value;
  }

  stake(amount: uint64): void {
    assert(amount > 0);
    // transfer token to contract
    sendPayment({
      amount: amount,
      sender: this.txn.sender,
      receiver: this.app.address,
    });
    this.balanceOf(this.txn.sender).value = this.balanceOf(this.txn.sender).value + amount;
    this.totalSupply.value = this.totalSupply.value + amount;
    this.updateReward(this.txn.sender);
  }

  withdraw(amount: uint64): void {
    assert(amount > 0);
    assert(this.balanceOf(this.txn.sender).value > amount);
    this.balanceOf(this.txn.sender).value = this.balanceOf(this.txn.sender).value - amount;
    this.totalSupply.value = this.totalSupply.value - amount;
    sendPayment({
      amount: amount,
      sender: this.app.address,
      receiver: this.txn.sender,
    });
    this.updateReward(this.txn.sender);
  }

  getReward(): void {
    const reward = this.rewards(this.txn.sender).value;
    if (reward > 0) {
      this.rewards(this.txn.sender).value = 0;
      sendPayment({
        amount: reward,
        sender: this.app.address,
        receiver: this.txn.sender,
      });
    }
  }

  setRewardsDuration(duration: uint64): void {
    assert(this.txn.sender === this.app.creator);
    assert(globals.latestTimestamp > this.finishAt.value);
    this.duration.value = duration;
  }

  notifyRewardAmount(amount: uint64): void {
    assert(this.txn.sender === this.app.creator);
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
}
