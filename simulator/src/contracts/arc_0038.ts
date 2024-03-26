import { unbond_state } from './credits';
import { bond_state } from './credits';
import { credits } from './credits';
import { creditsProgram } from './credits';

import assert from 'assert';
// interfaces
export interface withdrawal_state {
  microcredits: bigint;
  claim_block: bigint;
}
export class arc_0038Program {
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
  total_balance: Map<bigint, bigint> = new Map();
  validator: Map<bigint, string> = new Map();
  commission_percent: Map<bigint, bigint> = new Map();
  is_initialized: Map<bigint, boolean> = new Map();
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

  //program arc_0038.aleo {// Owner of the program
  // Address of this program

  // 0u8 -> Whether the program has been initialized

  /** Commission rate: BigInt("0") -> u128
  * percentage of rewards taken as commission
  * relative to precision of 1000
  * e.g. BigInt("100") = 10%
  */

  // 0u8 -> address of validator
  // 1u8 -> the address of the next validator, automatically updated after calling "bond_all"

  // 0u8 -> total balance of microcredits pooled

  // 0u8 -> total pool of delegator shares

  // address -> number of shares held by the delegator with this address

  // 0u8 -> balance pending withdrawal currently unbonding
  // 1u8 -> balance pending withdrawal owned by the program

  /** Unbonding allowed: BigInt("0") ->
  * The height at which the current withdrawal batch will be done unbonding
  * if not present or == BigInt("0"), a new batch can begin unbonding
  */


  // address -> pending withdrawal for the delegator with this address

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
    this.pending_withdrawal.set(BigInt("0"), BigInt("0"));
    this.pending_withdrawal.set(BigInt("1"), BigInt("0"));
    this.current_batch_height.set(BigInt("0"), BigInt("0"));
  }

  initial_deposit(
    input_record: credits,
    microcredits: bigint,
    validator_address: string,
  ) {
    assert(this.caller === this.ADMIN);
    // Must be a credits record because credits.aleo uses self.caller for transfers
    this.credits.caller = "arc_0038.aleo";
    let updated_record: credits = this.credits.transfer_private_to_public(input_record, this.CORE_PROTOCOL, microcredits);
    this.credits.caller = "arc_0038.aleo";
    this.credits.bond_public(validator_address, microcredits);

    this.finalize_initial_deposit(microcredits);
    return updated_record;
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
    this.total_shares.set(BigInt("0"), microcredits * this.SHARES_TO_MICROCREDITS);
    this.delegator_shares.set(this.ADMIN, microcredits * this.SHARES_TO_MICROCREDITS);
  }

  inline_get_commission(
    rewards: bigint,
    commission_rate: bigint,
  ) {
    let commission: bigint = (rewards * commission_rate) / this.PRECISION_UNSIGNED;
    let commission_64: bigint = commission;
    return commission_64;
  }

  get_commission_test(
    rewards: bigint,
    commission_rate: bigint,
  ) {
    return this.inline_get_commission(rewards, commission_rate);
  }

  inline_calculate_new_shares(
    balance: bigint,
    deposit: bigint,
    shares: bigint,
  ) {
    let new_total_shares: bigint = (shares * this.PRECISION_UNSIGNED) * (balance + deposit) / (balance * this.PRECISION_UNSIGNED);
    let diff: bigint = new_total_shares - shares;
    let shares_to_mint: bigint = diff;
    return shares_to_mint;
  }

  calculate_new_shares_test(
    balance: bigint,
    deposit: bigint,
    shares: bigint,
  ) {
    return this.inline_calculate_new_shares(balance, deposit, shares);
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
    let bonded: bigint = this.credits.bonded.get(this.CORE_PROTOCOL)?.microcredits || base.microcredits;
    let current_balance: bigint = this.total_balance.get(BigInt("0"))!;
    let current_shares: bigint = this.total_shares.get(BigInt("0"))!;
    let rewards: bigint = bonded > current_balance ? bonded - current_balance : BigInt("0");
    let commission_rate: bigint = this.commission_percent.get(BigInt("0"))!;
    let new_commission: bigint = this.inline_get_commission(rewards, commission_rate);
    current_balance += rewards - new_commission;

    let new_commission_shares: bigint = this.inline_calculate_new_shares(current_balance, new_commission, current_shares);
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
    this.credits.caller = "arc_0038.aleo";
    this.credits.unbond_public(pool_balance);

    return this.finalize_unbond_all(pool_balance);
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
    let bonded: bigint = this.credits.bonded.get(this.CORE_PROTOCOL)?.microcredits || base.microcredits;
    // Assert that the pool was fully unbonded
    assert(bonded === BigInt("0"));

    // Make sure all commission is claimed before unbonding
    let base_unbonding: unbond_state = {
      microcredits: BigInt("0"),
      height: BigInt("0")
    };
    let unbonding: bigint = this.credits.unbonding.get(this.CORE_PROTOCOL)?.microcredits || base_unbonding.microcredits;
    let unbonding_withdrawals: bigint = this.pending_withdrawal.get(BigInt("0"))!;
    let previously_bonded: bigint = unbonding - unbonding_withdrawals;
    let current_balance: bigint = this.total_balance.get(BigInt("0"))!;
    let current_shares: bigint = this.total_shares.get(BigInt("0"))!;
    let rewards: bigint = previously_bonded > current_balance ? previously_bonded - current_balance : BigInt("0");
    let commission_rate: bigint = this.commission_percent.get(BigInt("0"))!;
    let new_commission: bigint = this.inline_get_commission(rewards, commission_rate);
    current_balance += rewards - new_commission;

    let new_commission_shares: bigint = this.inline_calculate_new_shares(current_balance, new_commission, current_shares);
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
    // Call will fail if there is any balance still bonded to another validator
    this.credits.caller = "arc_0038.aleo";
    this.credits.bond_public(validator_address, amount);

    return this.finalize_bond_all(validator_address);
  }

  finalize_bond_all(
    validator_address: string,
  ) {
    let account_balance: bigint = this.credits.account.get(this.CORE_PROTOCOL)!; // this.credits.get(this.CORE_PROTOCOL);
    let pending_withdrawals: bigint = this.pending_withdrawal.get(BigInt("1"))!;
    assert(account_balance >= pending_withdrawals);

    // Set validator
    let has_next_validator: boolean = this.validator.has(BigInt("1"));
    let current_validator: string = has_next_validator ? this.validator.get(BigInt("1"))! : this.validator.get(BigInt("0"))!;
    assert(validator_address === current_validator);

    this.validator.set(BigInt("0"), current_validator);
    this.validator.delete(BigInt("1"));
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
    let bonded: bigint = this.credits.bonded.get(this.CORE_PROTOCOL)?.microcredits || base.microcredits;
    let current_balance: bigint = this.total_balance.get(BigInt("0"))!;
    let current_shares: bigint = this.total_shares.get(BigInt("0"))!;
    let rewards: bigint = bonded > current_balance ? bonded - current_balance : BigInt("0");
    let commission_rate: bigint = this.commission_percent.get(BigInt("0"))!;
    let new_commission: bigint = this.inline_get_commission(rewards, commission_rate);
    current_balance += rewards - new_commission;

    let new_commission_shares: bigint = this.inline_calculate_new_shares(current_balance, new_commission, current_shares);
    let current_commission: bigint = this.delegator_shares.get(this.ADMIN) || BigInt("0");
    this.delegator_shares.set(this.ADMIN, current_commission + new_commission_shares);

    this.total_shares.set(BigInt("0"), current_shares + new_commission_shares);
    this.total_balance.set(BigInt("0"), current_balance + new_commission);
  }

  deposit_public(
    input_record: credits,
    microcredits: bigint,
  ) {
    // Must be a credits record because credits.aleo uses self.caller for transfers
    this.credits.caller = "arc_0038.aleo";
    let updated_record: credits = this.credits.transfer_private_to_public(input_record, this.CORE_PROTOCOL, microcredits);

    this.finalize_deposit_public(this.caller, microcredits);
    return updated_record;
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
    let bonded: bigint = this.credits.bonded.get(this.CORE_PROTOCOL)?.microcredits || base.microcredits;
    let current_balance: bigint = this.total_balance.get(BigInt("0"))!;
    let current_shares: bigint = this.total_shares.get(BigInt("0"))!;
    let rewards: bigint = bonded > current_balance ? bonded - current_balance : BigInt("0");
    let commission_rate: bigint = this.commission_percent.get(BigInt("0"))!;
    let new_commission: bigint = this.inline_get_commission(rewards, commission_rate);
    //console.log('current_balance: ' + current_balance.toLocaleString());
    //console.log('current_shares: ' + current_shares.toLocaleString());
    current_balance += rewards - new_commission;
    //console.log('current_balance: ' + current_balance.toLocaleString());

    let new_commission_shares: bigint = this.inline_calculate_new_shares(current_balance, new_commission, current_shares);
    let current_commission: bigint = this.delegator_shares.get(this.ADMIN) || BigInt("0");
    this.delegator_shares.set(this.ADMIN, current_commission + new_commission_shares);

    //console.log('admin_shares: ' + this.delegator_shares.get(this.ADMIN)!.toLocaleString());

    current_shares += new_commission_shares;
    current_balance += new_commission;
    //console.log('current_balance: ' + current_balance.toLocaleString());

    // Calculate mint for deposit
    let new_shares: bigint = this.inline_calculate_new_shares(current_balance, microcredits, current_shares);

    //console.log('new shares: ' + new_shares.toLocaleString());
    //console.log('new total shares: ' + (current_shares + new_shares).toLocaleString());

    // Ensure mint amount is valid
    assert(new_shares >= BigInt("1"));

    // Update delegator_shares mapping
    let shares: bigint = this.delegator_shares.get(caller) || BigInt("0");
    this.delegator_shares.set(caller, shares + new_shares);

    // Update total shares
    this.total_shares.set(BigInt("0"), current_shares + new_shares);

    // Update total_balance
    this.total_balance.set(BigInt("0"), current_balance + microcredits);
  }

  withdraw_public(
    withdrawal_shares: bigint,
    total_withdrawal: bigint,
  ) {
    this.credits.caller = "arc_0038.aleo";
    this.credits.unbond_public(total_withdrawal);

    return this.finalize_withdraw_public(withdrawal_shares, total_withdrawal, this.caller);
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

    // Distribute shares for new commission
    // Simulate call to credits.aleo/bonded.get_or_use(CORE_PROTOCOL).microcredits;
    let base: bond_state = {
      validator: 'test-validator',
      microcredits: BigInt("0")
    };
    let bonded: bigint = this.credits.bonded.get(this.CORE_PROTOCOL)?.microcredits || base.microcredits;
    // Add back the withdrawal amount to appropriately calculate rewards before the withdrawal
    bonded += total_withdrawal;
    let current_balance: bigint = this.total_balance.get(BigInt("0"))!;
    let current_shares: bigint = this.total_shares.get(BigInt("0"))!;
    let rewards: bigint = bonded > current_balance ? bonded - current_balance : BigInt("0");
    //console.log('rewards: ' + rewards.toLocaleString());
    let commission_rate: bigint = this.commission_percent.get(BigInt("0"))!;
    let new_commission: bigint = this.inline_get_commission(rewards, commission_rate);
    //console.log('new_commission: ' + new_commission.toLocaleString());
    current_balance += rewards - new_commission;

    let new_commission_shares: bigint = this.inline_calculate_new_shares(current_balance, new_commission, current_shares);
    //console.log('new_commission_shares: ' + new_commission_shares.toLocaleString());
    let current_commission: bigint = this.delegator_shares.get(this.ADMIN) || BigInt("0");
    this.delegator_shares.set(this.ADMIN, current_commission + new_commission_shares);

    current_shares += new_commission_shares;
    current_balance += new_commission;

    // Calculate withdrawal amount
    let withdrawal_calculation: bigint = (withdrawal_shares * current_balance * this.PRECISION_UNSIGNED) / (current_shares * this.PRECISION_UNSIGNED);
    // console.log(`\x1b[33mwithdrawal calculation: ${withdrawal_calculation.toLocaleString()}\x1b[0m`);
    // console.log('withdrawal shares: ' + withdrawal_shares.toLocaleString());
    // console.log('total shares: ' + current_shares.toLocaleString());
    // console.log('total balance: ' + current_balance.toLocaleString());

    // If the calculated withdrawal amount is greater than total_withdrawal, the excess will stay in the pool
    assert(withdrawal_calculation >= total_withdrawal);

    // Update withdrawals mappings
    let batch_height: bigint = new_batch ? this.inline_get_new_batch_height(this.block.height) : current_batch;
    this.current_batch_height.set(BigInt("0"), batch_height);
    let withdrawal: withdrawal_state = {
      microcredits: total_withdrawal,
      claim_block: batch_height
    };
    this.withdrawals.set(owner, withdrawal);

    // Update pending withdrawal
    let currently_unbonding: bigint = this.pending_withdrawal.get(BigInt("0"))!;
    this.pending_withdrawal.set(BigInt("0"), currently_unbonding + total_withdrawal);

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

  get_new_batch_height_test(
    height: bigint,
  ) {
    return this.inline_get_new_batch_height(height);
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
    let bonded: bigint = this.credits.bonded.get(this.CORE_PROTOCOL)?.microcredits || base.microcredits;
    assert(bonded === BigInt("0"));
    // Simulate call to credits.aleo/unbonding.get_or_use(CORE_PROTOCOL).microcredits;
    let base_unbonding: unbond_state = {
      microcredits: BigInt("0"),
      height: BigInt("0")
    };
    let unbonding: bigint = this.credits.unbonding.get(this.CORE_PROTOCOL)?.microcredits || base_unbonding.microcredits;
    assert(unbonding === BigInt("0"));

    // Assert that they have enough to withdraw
    let delegator_balance: bigint = this.delegator_shares.get(owner)!;
    assert(delegator_balance >= withdrawal_shares);

    // Calculate withdrawal amount
    let current_balance: bigint = this.total_balance.get(BigInt("0"))!;
    let current_shares: bigint = this.total_shares.get(BigInt("0"))!;
    let withdrawal_calculation: bigint = (withdrawal_shares * current_balance * this.PRECISION_UNSIGNED) / (current_shares * this.PRECISION_UNSIGNED);
    let total_withdrawal: bigint = withdrawal_calculation;

    // Update withdrawals mappings
    let withdrawal: withdrawal_state = {
      microcredits: total_withdrawal,
      claim_block: this.block.height
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
    this.credits.caller = "arc_0038.aleo";
    this.credits.transfer_public(recipient, amount);

    return this.finalize_claim_withdrawal_public(recipient, amount);
  }

  finalize_claim_withdrawal_public(
    owner: string,
    amount: bigint,
  ) {
    let withdrawal: withdrawal_state = this.withdrawals.get(owner)!;
    assert(this.block.height >= withdrawal.claim_block);
    assert(withdrawal.microcredits === amount);

    // Remove withdrawal
    this.withdrawals.delete(owner);

    // Update pending withdrawal
    let currently_pending: bigint = this.pending_withdrawal.get(BigInt("1"))!;
    this.pending_withdrawal.set(BigInt("1"), currently_pending - amount);
  }
}
