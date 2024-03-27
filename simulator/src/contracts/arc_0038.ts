import { unbond_state } from './credits';
import { bond_state } from './credits';
import { creditsProgram } from './credits';

import assert from 'assert';
// interfaces
export interface withdrawal_state {
  microcredits: bigint;
  claim_block: bigint;
}
export class arc_0038Program {
  signer: string = "not set";
  caller: string = "not set";
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  // params
  withdrawals: Map<string, withdrawal_state> = new Map();
  current_batch_height: Map<bigint, bigint> = new Map();
  pending_withdrawal: Map<bigint, bigint> = new Map();
  delegator_shares: Map<string, bigint> = new Map();
  total_shares: Map<bigint, bigint> = new Map();
  pending_deposits: Map<bigint, bigint> = new Map();
  total_balance: Map<bigint, bigint> = new Map();
  validator: Map<bigint, string> = new Map();
  commission_percent: Map<bigint, bigint> = new Map();
  is_initialized: Map<bigint, boolean> = new Map();
  MINIMUM_BOND_AMOUNT = BigInt("10000000000");
  UNBONDING_PERIOD = BigInt("360");
  MAX_COMMISSION_RATE = BigInt("500");
  PRECISION_UNSIGNED = BigInt("1000");
  SHARES_TO_MICROCREDITS = BigInt("1000");
  CORE_PROTOCOL = "arc_0038.aleo";
  ADMIN = "admin";
  credits: creditsProgram;
  constructor(
    // constructor args
    creditsContract: creditsProgram,
  ) {
    // constructor body
    this.credits = creditsContract;
  }

  initialize(
    commission_rate: bigint,
    validator_address: string,
  ) {
    assert(this.caller === this.ADMIN);
    assert(commission_rate < this.PRECISION_UNSIGNED);
    assert(commission_rate <= this.MAX_COMMISSION_RATE);

    return this.finalize_initialize(commission_rate, validator_address);
  }

  finalize_initialize(
    commission_rate: bigint,
    validator_address: string,
  ) {
    let initialized: boolean = this.is_initialized.get(BigInt("0")) || false;
    assert(initialized === false);

    this.is_initialized.set(BigInt("0"), true);
    this.commission_percent.set(BigInt("0"), commission_rate);
    this.validator.set(BigInt("0"), validator_address);
    this.total_shares.set(BigInt("0"), BigInt("0"));
    this.total_balance.set(BigInt("0"), BigInt("0"));
    this.pending_deposits.set(BigInt("0"), BigInt("0"));
    this.pending_withdrawal.set(BigInt("0"), BigInt("0"));
    this.pending_withdrawal.set(BigInt("1"), BigInt("0"));
    this.current_batch_height.set(BigInt("0"), BigInt("0"));
  }

  initial_deposit(
    microcredits: bigint,
    validator_address: string,
  ) {
    assert(this.caller === this.ADMIN);
    // credits.aleo/transfer_public_as_signer(CORE_PROTOCOL, microcredits);
    this.credits.signer = this.caller;
    this.credits.caller = "arc_0038.aleo";
    this.credits.transfer_public_as_signer(this.CORE_PROTOCOL, microcredits);
    this.credits.caller = "arc_0038.aleo";
    this.credits.bond_public(validator_address, microcredits);

    return this.finalize_initial_deposit(microcredits);
  }

  finalize_initial_deposit(
    microcredits: bigint,
  ) {
    assert(this.is_initialized.get(BigInt("0"))!);

    let balance: bigint = this.total_balance.get(BigInt("0")) || BigInt("0");
    let shares: bigint = this.total_shares.get(BigInt("0")) || BigInt("0");
    assert(balance === BigInt("0"));
    assert(shares === BigInt("0"));

    this.total_balance.set(BigInt("0"), microcredits);
    shares = microcredits * this.SHARES_TO_MICROCREDITS;
    this.total_shares.set(BigInt("0"), shares);
    this.delegator_shares.set(this.ADMIN, shares);
  }

  inline_get_commission(
    rewards: bigint,
    commission_rate: bigint,
  ) {
    let commission: bigint = rewards * commission_rate / this.PRECISION_UNSIGNED;
    let commission_64: bigint = commission;
    return commission_64;
  }

  inline_calculate_new_shares(
    bonded_balance: bigint,
    pending_deposit_pool: bigint,
    deposit: bigint,
    shares: bigint,
  ) {
    let full_balance: bigint = bonded_balance + pending_deposit_pool;
    let new_total_shares: bigint = (shares * this.PRECISION_UNSIGNED) * (full_balance + deposit) / (full_balance * this.PRECISION_UNSIGNED);
    let diff: bigint = new_total_shares - shares;
    let shares_to_mint: bigint = diff;
    return shares_to_mint;
  }

  set_commission_percent(
    new_commission_rate: bigint,
  ) {
    assert(this.caller === this.ADMIN);
    assert(new_commission_rate < this.PRECISION_UNSIGNED);
    assert(new_commission_rate <= this.MAX_COMMISSION_RATE);

    return this.finalize_set_commission_percent(new_commission_rate);
  }

  finalize_set_commission_percent(
    new_commission_rate: bigint,
  ) {
    // Make sure all commission is claimed before changing the rate
    // Simulate call to credits.aleo/bonded.get_or_use(CORE_PROTOCOL).microcredits;
    let base: bond_state = {
      validator: 'test-validator',
      microcredits: BigInt("0")
    };
    let bonded: bigint = this.credits.bonded.get(this.CORE_PROTOCOL)?.microcredits || base?.microcredits;
    let current_balance: bigint = this.total_balance.get(BigInt("0"))!;
    let current_shares: bigint = this.total_shares.get(BigInt("0"))!;
    let rewards: bigint = bonded > current_balance ? bonded - current_balance : BigInt("0");
    let commission_rate: bigint = this.commission_percent.get(BigInt("0"))!;
    let new_commission: bigint = this.inline_get_commission(rewards, commission_rate);
    current_balance += rewards - new_commission;

    let pending_deposit_pool: bigint = this.pending_deposits.get(BigInt("0"))!;
    let new_commission_shares: bigint = this.inline_calculate_new_shares(current_balance, pending_deposit_pool, new_commission, current_shares);
    let current_commission: bigint = this.delegator_shares.get(this.ADMIN) || BigInt("0");
    this.delegator_shares.set(this.ADMIN, current_commission + new_commission_shares);

    this.total_shares.set(BigInt("0"), current_shares + new_commission_shares);
    this.total_balance.set(BigInt("0"), current_balance + new_commission);

    this.commission_percent.set(BigInt("0"), new_commission_rate);
  }

  // Update the validator address, to be applied automatically on the next bond_all call
  set_next_validator(
    validator_address: string,
  ) {
    assert(this.caller === this.ADMIN);

    return this.finalize_set_next_validator(validator_address);
  }

  finalize_set_next_validator(
    validator_address: string,
  ) {
    this.validator.set(BigInt("1"), validator_address);
  }

  unbond_all(
    pool_balance: bigint,
  ) {
    let unbond_state = this.credits.unbonding.get(this.CORE_PROTOCOL);
    if (unbond_state) {
      unbond_state = {...unbond_state};
    }
    let bonded_state = this.credits.bonded.get(this.CORE_PROTOCOL);
    if (bonded_state) {
      bonded_state = {...bonded_state};
    }
    try {
      this.credits.caller = "arc_0038.aleo";
      this.credits.unbond_public(pool_balance);

      return this.finalize_unbond_all(pool_balance);
    } catch (error) {
      if (unbond_state) {
        this.credits.unbonding.set(this.CORE_PROTOCOL, unbond_state);
      } else {
        this.credits.unbonding.delete(this.CORE_PROTOCOL);
      }
      if (bonded_state) {
        this.credits.bonded.set(this.CORE_PROTOCOL, bonded_state);
      } else {
        this.credits.bonded.delete(this.CORE_PROTOCOL);
      }

      throw error;
    }
  }

  finalize_unbond_all(
    pool_balance: bigint,
  ) {
    let next_validator: boolean = this.validator.has(BigInt("1"));
    assert(next_validator);

    // Simulate call to credits.aleo/bonded.get_or_use(CORE_PROTOCOL).microcredits;
    let base: bond_state = {
      validator: 'test-validator',
      microcredits: BigInt("0")
    };
    let bonded: bigint = this.credits.bonded.get(this.CORE_PROTOCOL)?.microcredits || base?.microcredits;
    // Assert that the pool was fully unbonded
    assert(bonded === BigInt("0"));

    // Make sure all commission is claimed before unbonding
    let base_unbonding: unbond_state = {
      microcredits: BigInt("0"),
      height: BigInt("0")
    };
    let unbonding: bigint = this.credits.unbonding.get(this.CORE_PROTOCOL)?.microcredits || base_unbonding?.microcredits;
    let unbonding_withdrawals: bigint = this.pending_withdrawal.get(BigInt("0"))!;
    let previously_bonded: bigint = unbonding - unbonding_withdrawals;
    let current_balance: bigint = this.total_balance.get(BigInt("0"))!;
    let current_shares: bigint = this.total_shares.get(BigInt("0"))!;
    let rewards: bigint = previously_bonded > current_balance ? previously_bonded - current_balance : BigInt("0");
    let commission_rate: bigint = this.commission_percent.get(BigInt("0"))!;
    let new_commission: bigint = this.inline_get_commission(rewards, commission_rate);
    current_balance += rewards - new_commission;

    let pending_deposit_pool: bigint = this.pending_deposits.get(BigInt("0"))!;
    let new_commission_shares: bigint = this.inline_calculate_new_shares(current_balance, pending_deposit_pool, new_commission, current_shares);
    let current_commission: bigint = this.delegator_shares.get(this.ADMIN) || BigInt("0");
    this.delegator_shares.set(this.ADMIN, current_commission + new_commission_shares);

    this.total_shares.set(BigInt("0"), current_shares + new_commission_shares);
    this.total_balance.set(BigInt("0"), current_balance + new_commission);
  }

  claim_unbond(
  ) {
    this.credits.caller = "arc_0038.aleo";
    this.credits.claim_unbond_public();

    return this.finalize_claim_unbond();
  }

  finalize_claim_unbond(
  ) {
    this.current_batch_height.delete(BigInt("0"));
    let unbonding_withdrawals: bigint = this.pending_withdrawal.get(BigInt("0"))!;
    let already_claimed: bigint = this.pending_withdrawal.get(BigInt("1"))!;
    already_claimed += unbonding_withdrawals;

    this.pending_withdrawal.set(BigInt("0"), BigInt("0"));
    this.pending_withdrawal.set(BigInt("1"), already_claimed);
  }

  bond_all(
    validator_address: string,
    amount: bigint,
  ) {
    let bond_state = this.credits.bonded.get(this.CORE_PROTOCOL);
    if (bond_state) {
      bond_state = {...bond_state};
    }
    let balance: bigint = this.credits.account.get(this.CORE_PROTOCOL) || BigInt("0");
    try {
      this.credits.caller = "arc_0038.aleo";
      this.credits.bond_public(validator_address, amount);

      return this.finalize_bond_all(validator_address, amount);
    } catch (error) {
      if (bond_state) {
        this.credits.bonded.set(this.CORE_PROTOCOL, bond_state!);
      } else {
        this.credits.bonded.delete(this.CORE_PROTOCOL);
      }
      this.credits.account.set(this.CORE_PROTOCOL, balance);
      throw error;
    }
  }

  finalize_bond_all(
    validator_address: string,
    amount: bigint,
  ) {
    let account_balance: bigint = this.credits.account.get(this.CORE_PROTOCOL)!; // this.credits.get(this.CORE_PROTOCOL);
    let pending_withdrawals: bigint = this.pending_withdrawal.get(BigInt("1"))!;
    assert(account_balance >= pending_withdrawals);


    // Set validator
    let next_validator: string = this.validator.get(BigInt("1"))!;
    assert(validator_address === next_validator);
    this.validator.set(BigInt("0"), next_validator);
    this.validator.delete(BigInt("1"));

    // Simulate call to credits.aleo/bonded.get_or_use(CORE_PROTOCOL).microcredits;
    let base: bond_state = {
      validator: 'test-validator',
      microcredits: BigInt("0")
    };
    let bonded: bigint = this.credits.bonded.get(this.CORE_PROTOCOL)?.microcredits || base?.microcredits;
    let current_balance: bigint = this.total_balance.get(BigInt("0"))!;
    let pending_deposit_balance: bigint = this.pending_deposits.get(BigInt("0"))!;

    pending_deposit_balance = pending_deposit_balance + current_balance - bonded;
    this.pending_deposits.set(BigInt("0"), pending_deposit_balance);
    this.total_balance.set(BigInt("0"), bonded);
  }

  bond_deposits(
    validator_address: string,
    amount: bigint,
  ) {
    let bond_state = this.credits.bonded.get(this.CORE_PROTOCOL);
    if (bond_state) {
      bond_state = {...bond_state};
    }
    let balance: bigint = this.credits.account.get(this.CORE_PROTOCOL) || BigInt("0");
    try {
      this.credits.caller = "arc_0038.aleo";
      this.credits.bond_public(validator_address, amount);

      return this.finalize_bond_deposits(validator_address, amount);
    } catch (error) {
      if (bond_state) {
        this.credits.bonded.set(this.CORE_PROTOCOL, bond_state);
      } else {
        this.credits.bonded.delete(this.CORE_PROTOCOL);
      }
      this.credits.account.set(this.CORE_PROTOCOL, balance);
      throw error;
    }
  }

  finalize_bond_deposits(
    validator_address: string,
    amount: bigint,
  ) {
    let account_balance: bigint = this.credits.account.get(this.CORE_PROTOCOL)!; // this.credits.get(this.CORE_PROTOCOL);
    let pending_withdrawals: bigint = this.pending_withdrawal.get(BigInt("1"))!;
    assert(account_balance >= pending_withdrawals);

    let has_next_validator: boolean = this.validator.has(BigInt("1"));
    assert(has_next_validator === false);

    let current_balance: bigint = this.total_balance.get(BigInt("0"))!;
    let pending_deposit_balance: bigint = this.pending_deposits.get(BigInt("0"))!;

    pending_deposit_balance = pending_deposit_balance - amount;
    this.pending_deposits.set(BigInt("0"), pending_deposit_balance);
    this.total_balance.set(BigInt("0"), current_balance + amount);
  }

  claim_commission(
  ) {
    assert(this.caller === this.ADMIN);
    return this.finalize_claim_commission();
  }

  finalize_claim_commission(
  ) {
    // Distribute shares for new commission
    // Simulate call to credits.aleo/bonded.get_or_use(CORE_PROTOCOL).microcredits;
    let base: bond_state = {
      validator: 'test-validator',
      microcredits: BigInt("0")
    };
    let bonded: bigint = this.credits.bonded.get(this.CORE_PROTOCOL)?.microcredits || base?.microcredits;
    let current_balance: bigint = this.total_balance.get(BigInt("0"))!;
    let current_shares: bigint = this.total_shares.get(BigInt("0"))!;
    let rewards: bigint = bonded > current_balance ? bonded - current_balance : BigInt("0");
    let commission_rate: bigint = this.commission_percent.get(BigInt("0"))!;
    let new_commission: bigint = this.inline_get_commission(rewards, commission_rate);
    current_balance += rewards - new_commission;

    let pending_deposit_pool: bigint = this.pending_deposits.get(BigInt("0"))!;
    let new_commission_shares: bigint = this.inline_calculate_new_shares(current_balance, pending_deposit_pool, new_commission, current_shares);
    let current_commission: bigint = this.delegator_shares.get(this.ADMIN) || BigInt("0");
    this.delegator_shares.set(this.ADMIN, current_commission + new_commission_shares);

    this.total_shares.set(BigInt("0"), current_shares + new_commission_shares);
    this.total_balance.set(BigInt("0"), current_balance + new_commission);
  }

  deposit_public(
    microcredits: bigint,
  ) {
    try {
      this.credits.signer = this.caller;
      this.credits.caller = "arc_0038.aleo";
      this.credits.transfer_public_as_signer(this.CORE_PROTOCOL, microcredits);

      return this.finalize_deposit_public(this.caller, microcredits);
    } catch (error) {
      this.credits.caller = "arc_0038.aleo";
      this.credits.transfer_public(this.caller, microcredits);
      throw error;
    }
  }

  finalize_deposit_public(
    caller: string,
    microcredits: bigint,
  ) {
    // Distribute shares for new commission
    // Simulate call to credits.aleo/bonded.get_or_use(CORE_PROTOCOL).microcredits;
    let base: bond_state = {
      validator: 'test-validator',
      microcredits: BigInt("0")
    };
    let bonded: bigint = this.credits.bonded.get(this.CORE_PROTOCOL)?.microcredits || base?.microcredits;
    let current_balance: bigint = this.total_balance.get(BigInt("0"))!;
    let current_shares: bigint = this.total_shares.get(BigInt("0"))!;
    let rewards: bigint = bonded > current_balance ? bonded - current_balance : BigInt("0");
    let commission_rate: bigint = this.commission_percent.get(BigInt("0"))!;
    let new_commission: bigint = this.inline_get_commission(rewards, commission_rate);
    current_balance += rewards - new_commission;

    let pending_deposit_pool: bigint = this.pending_deposits.get(BigInt("0"))!;
    let new_commission_shares: bigint = this.inline_calculate_new_shares(current_balance, pending_deposit_pool, new_commission, current_shares);
    let current_commission: bigint = this.delegator_shares.get(this.ADMIN) || BigInt("0");
    this.delegator_shares.set(this.ADMIN, current_commission + new_commission_shares);

    current_shares += new_commission_shares;
    current_balance += new_commission;

    // Calculate mint for deposit
    let new_shares: bigint = this.inline_calculate_new_shares(current_balance, pending_deposit_pool, microcredits, current_shares);

    // Ensure mint amount is valid
    assert(new_shares >= BigInt("1"));

    // Update total balance
    this.total_balance.set(BigInt("0"), current_balance);

    // Update delegator_shares mapping
    let shares: bigint = this.delegator_shares.get(caller) || BigInt("0");
    this.delegator_shares.set(caller, shares + new_shares);

    // Update total shares
    this.total_shares.set(BigInt("0"), current_shares + new_shares);

    // Update pending_deposits
    let pending: bigint = this.pending_deposits.get(BigInt("0"))!;
    this.pending_deposits.set(BigInt("0"), pending + microcredits);
  }

  withdraw_public(
    withdrawal_shares: bigint,
    total_withdrawal: bigint,
  ) {
    let unbond_state = this.credits.unbonding.get(this.CORE_PROTOCOL);
    if (unbond_state) {
      unbond_state = {...unbond_state};
    }
    let bonded_state = this.credits.bonded.get(this.CORE_PROTOCOL);
    if (bonded_state) {
      bonded_state = {...bonded_state};
    }
    try {
      this.credits.caller = "arc_0038.aleo";
      this.credits.unbond_public(total_withdrawal);

      return this.finalize_withdraw_public(withdrawal_shares, total_withdrawal, this.caller);
    } catch (error) {
      if (unbond_state) {
        this.credits.unbonding.set(this.CORE_PROTOCOL, unbond_state);
      } else {
        this.credits.unbonding.delete(this.CORE_PROTOCOL);
      }
      if (bonded_state) {
        this.credits.bonded.set(this.CORE_PROTOCOL, bonded_state);
      } else {
        this.credits.bonded.delete(this.CORE_PROTOCOL);
      }
      throw error;
    }
  }

  finalize_withdraw_public(
    withdrawal_shares: bigint,
    total_withdrawal: bigint,
    owner: string,
  ) {
    // Assert that they don't have any pending withdrawals
    let currently_withdrawing: boolean = this.withdrawals.has(owner);
    assert(currently_withdrawing === false);

    // Determine if the withdrawal can fit into the current batch
    let current_batch: bigint = this.current_batch_height.get(BigInt("0")) || BigInt("0");
    let min_claim_height: bigint = this.block.height + this.UNBONDING_PERIOD;
    let new_batch: boolean = current_batch == BigInt("0");
    let unbonding_allowed: boolean = new_batch || current_batch >= min_claim_height;
    assert(unbonding_allowed);

    // Assert that they have enough to withdraw
    let delegator_balance: bigint = this.delegator_shares.get(owner)!;
    assert(delegator_balance >= withdrawal_shares);

    // Make sure we aren't unbonding the entire pool if there are pending deposits to keep us above the minimum
    let base: bond_state = {
      validator: 'test-validator',
      microcredits: BigInt("0")
    };
    let bonded: bigint = this.credits.bonded.get(this.CORE_PROTOCOL)?.microcredits || base?.microcredits;

    let base_unbonding: unbond_state = {
      microcredits: BigInt("0"),
      height: BigInt("0")
    };
    let unbonding: bigint = this.credits.unbonding.get(this.CORE_PROTOCOL)?.microcredits || base_unbonding?.microcredits;
    let unbonding_withdrawals: bigint = this.pending_withdrawal.get(BigInt("0"))!;
    let newly_unbonded: bigint = unbonding - unbonding_withdrawals;
    let pending_deposit_pool: bigint = this.pending_deposits.get(BigInt("0"))!;
    let sufficient_deposits: boolean = newly_unbonded - total_withdrawal + pending_deposit_pool >= this.MINIMUM_BOND_AMOUNT;

    assert(bonded >= this.MINIMUM_BOND_AMOUNT || sufficient_deposits);

    // Distribute shares for new commission
    // Add back the withdrawal amount to appropriately calculate rewards before the withdrawal
    bonded += total_withdrawal;
    let current_balance: bigint = this.total_balance.get(BigInt("0"))!;
    let current_shares: bigint = this.total_shares.get(BigInt("0"))!;
    let rewards: bigint = bonded > current_balance ? bonded - current_balance : BigInt("0");
    let commission_rate: bigint = this.commission_percent.get(BigInt("0"))!;
    let new_commission: bigint = this.inline_get_commission(rewards, commission_rate);
    current_balance += rewards - new_commission;

    let new_commission_shares: bigint = this.inline_calculate_new_shares(current_balance, pending_deposit_pool, new_commission, current_shares);
    let current_commission: bigint = this.delegator_shares.get(this.ADMIN) || BigInt("0");

    current_shares += new_commission_shares;
    current_balance += new_commission;

    // Calculate full pool size
    let full_pool: bigint = current_balance + pending_deposit_pool;

    // Calculate withdrawal amount
    let withdrawal_calculation: bigint = (withdrawal_shares * full_pool * this.PRECISION_UNSIGNED) / (current_shares * this.PRECISION_UNSIGNED);

    // If the calculated withdrawal amount is greater than total_withdrawal, the excess will stay in the pool
    assert(withdrawal_calculation >= total_withdrawal, `withdrawal_calculation: ${withdrawal_calculation}, total_withdrawal: ${total_withdrawal}`);

    // Update commission shares
    this.delegator_shares.set(this.ADMIN, current_commission + new_commission_shares);

    // Update withdrawals mappings
    let batch_height: bigint = new_batch ? this.inline_get_new_batch_height(this.block.height) : current_batch;
    this.current_batch_height.set(BigInt("0"), batch_height);
    let withdrawal: withdrawal_state = {
      microcredits: total_withdrawal,
      claim_block: batch_height
    };
    this.withdrawals.set(owner, withdrawal);

    // Update pending withdrawal
    this.pending_withdrawal.set(BigInt("0"), unbonding_withdrawals + total_withdrawal);

    // Update total balance
    this.total_balance.set(BigInt("0"), current_balance - total_withdrawal);

    // Update total shares
    this.total_shares.set(BigInt("0"), current_shares - withdrawal_shares);

    // Update delegator_shares mapping
    this.delegator_shares.set(owner, delegator_balance - withdrawal_shares);
  }

  inline_get_new_batch_height(
    height: bigint,
  ) {
    let rounded_down: bigint = (height) / BigInt("1000") * BigInt("1000");
    let rounded_up: bigint = rounded_down + BigInt("1000");
    return rounded_up;
  }

  create_withdraw_claim(
    withdrawal_shares: bigint,
  ) {
    return this.finalize_create_withdraw_claim(withdrawal_shares, this.caller);
  }

  finalize_create_withdraw_claim(
    withdrawal_shares: bigint,
    owner: string,
  ) {
    // Assert that they don't have any pending withdrawals
    let currently_withdrawing: boolean = this.withdrawals.has(owner);
    assert(currently_withdrawing === false);

    // Simulate call to credits.aleo/bonded.get_or_use(CORE_PROTOCOL).microcredits;
    let base: bond_state = {
      validator: 'test-validator',
      microcredits: BigInt("0")
    };
    let bonded: bigint = this.credits.bonded.get(this.CORE_PROTOCOL)?.microcredits || base?.microcredits;
    assert(bonded === BigInt("0"));

    // Simulate call to credits.aleo/unbonding.get_or_use(CORE_PROTOCOL).microcredits;
    let base_unbonding: unbond_state = {
      microcredits: BigInt("0"),
      height: BigInt("0")
    };
    let unbonding: bigint = this.credits.unbonding.get(this.CORE_PROTOCOL)?.microcredits || base_unbonding?.microcredits;
    assert(unbonding === BigInt("0"));

    // Assert that they have enough to withdraw
    let delegator_balance: bigint = this.delegator_shares.get(owner)!;
    assert(delegator_balance >= withdrawal_shares);

    // Calculate withdrawal amount
    let current_balance: bigint = this.total_balance.get(BigInt("0"))!;
    let pending_deposit_pool: bigint = this.pending_deposits.get(BigInt("0"))!;
    let full_pool: bigint = current_balance + pending_deposit_pool;
    let current_shares: bigint = this.total_shares.get(BigInt("0"))!;
    let withdrawal_calculation: bigint = (withdrawal_shares * full_pool * this.PRECISION_UNSIGNED) / (current_shares * this.PRECISION_UNSIGNED);
    let total_withdrawal: bigint = withdrawal_calculation;

    // Update withdrawals mappings
    let withdrawal: withdrawal_state = {
      microcredits: total_withdrawal,
      claim_block: this.block.height + BigInt(1)
    };
    this.withdrawals.set(owner, withdrawal);

    // Update pending withdrawal
    let currently_pending: bigint = this.pending_withdrawal.get(BigInt("1"))!;
    this.pending_withdrawal.set(BigInt("1"), currently_pending + total_withdrawal);

    // Update total balance
    this.total_balance.set(BigInt("0"), current_balance - total_withdrawal);

    // Update total shares
    this.total_shares.set(BigInt("0"), current_shares - withdrawal_shares);

    // Update delegator_shares mapping
    this.delegator_shares.set(owner, delegator_balance - withdrawal_shares);
  }

  claim_withdrawal_public(
    recipient: string,
    amount: bigint,
  ) {
    let withdrawal = this.withdrawals.get(recipient);
    if (withdrawal) {
      withdrawal = {...withdrawal};
    }
    let pending_withdrawal: bigint = this.pending_withdrawal.get(BigInt("1")) || BigInt("0");
    try {
      this.credits.caller = "arc_0038.aleo";
      this.credits.transfer_public(recipient, amount);

      return this.finalize_claim_withdrawal_public(recipient, amount);
    } catch (error) {
      this.credits.caller = recipient;
      this.credits.transfer_public('arc_0038.aleo', amount);
      if (withdrawal) {
        this.withdrawals.set(recipient, withdrawal);
      } else {
        this.withdrawals.delete(recipient);
      }
      this.pending_withdrawal.set(BigInt("1"), pending_withdrawal);
      throw error;
    }
  }

  finalize_claim_withdrawal_public(
    owner: string,
    amount: bigint,
  ) {
    let withdrawal: withdrawal_state = this.withdrawals.get(owner)!;
    assert(this.block.height >= withdrawal.claim_block);
    assert(withdrawal.microcredits === amount);

    // Update pending withdrawal
    let currently_pending: bigint = this.pending_withdrawal.get(BigInt("1"))!;
    assert(currently_pending >= amount);
    // Remove withdrawal
    this.withdrawals.delete(owner);
    this.pending_withdrawal.set(BigInt("1"), currently_pending - amount);
  }
}
