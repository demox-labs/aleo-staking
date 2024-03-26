import credits.aleo;

program staking_lite.aleo {
  // Owner of the program
  const ADMIN: address = aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru;
  // Address of this program
  const CORE_PROTOCOL: address = aleo17hwvp7fl5da40hd29heasjjm537uqce489hhuc3lwhxfm0njucpq0rvfny;
  const PRECISION_UNSIGNED: u128 = 1000u128;
  const MAX_COMMISSION_RATE: u128 = 500u128; // Max Commission Rate set to 50%
  const UNBONDING_PERIOD: u32 = 360u32;
  const NULL_ADDRESS: address = aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc;

  /** Commission rate: 0u8 -> u128
    * percentage of rewards taken as commission
    * relative to precision of 1000
    * e.g. 100u128 = 10%
  */
  mapping commission_percent: u8 => u128;

  // 0u8 -> address of validator
  // 1u8 -> the address of the next validator, automatically updated after calling "bond_all"
  mapping validator: u8 => address;

  /** Program controls: 0u8 ->
    * 0u8: functioning as normal
    * 1u8: full unbond in progress
    * 2u8: protocol fully unbonded
  */
  mapping state: u8 => u8;

  // 0u8 -> Whether the program has been initialized;
  mapping is_initalized: u8 => u8;

  // 0u8 -> total pool of delegator tokens
  mapping total_shares: u8 => u64;

  // address -> number of shares held by the delegator with this address
  mapping delegator_shares: address => u64;

  // 0u8 -> total balance in microcredits, updated for each deposit and withdrawal
  mapping total_balance: u8 => u64;

  // 0u8 -> balance pending withdrawal in microcredits
  mapping pending_withdrawal: u8 => u64;

  /** Unbonding allowed: 0u8 ->
    * The height at which the current withdrawal batch will be done unbonding
    * if not present or == 0u32, a new batch can begin unbonding
  */
  mapping current_batch_height: u8 => u32;

  struct withdrawal_state {
    microcredits: u64;
    claim_block: u32;
  }

  // address -> pending withdrawal for the delegator with this address
  mapping withdrawals: address => withdrawal_state;

  transition initialize(commission_rate: u128, validator_address: address) {
    assert_eq(self.signer, ADMIN);
    assert(commission_rate < PRECISION_UNSIGNED);

    return then finalize(commission_rate, validator_address);
  }

  finalize initialize(commission_rate: u128, validator_address: address) {
    // Ensure program is only initialized once
    let initialized: u8 = is_initalized.get_or_use(0u8, 0u8);
    assert_eq(initialized, 0u8);

    is_initalized.set(0u8, 1u8);
    commission_percent.set(0u8, commission_rate);
    validator.set(0u8, validator_address);
    state.set(0u8, 0u8);
    total_shares.set(0u8, 0u64);
    total_balance.set(0u8, 0u64);
    pending_withdrawal.set(0u8, 0u64);
    current_batch_height.set(0u8, 0u32);
  }

  transition initial_deposit(
    input_record: credits.aleo/credits,
    microcredits: u64,
    validator_address: address
  ) -> credits.aleo/credits {
    assert_eq(self.signer, ADMIN);
    // Must be a credits record because credits.aleo uses self.caller for transfers
    let updated_record: credits.aleo/credits = credits.aleo/transfer_private_to_public(input_record, CORE_PROTOCOL, microcredits);
    credits.aleo/bond_public(validator_address, microcredits);

    return (updated_record) then finalize(microcredits);
  }

  finalize initial_deposit(microcredits: u64) {
    // Ensure program is initialized
    let initialized: u8 = is_initalized.get_or_use(0u8, 0u8);
    assert_eq(initialized, 1u8);

    let balance: u64 = total_balance.get_or_use(0u8, 0u64);
    let shares: u64 = total_shares.get_or_use(0u8, 0u64);
    let pending: u64 = pending_withdrawal.get_or_use(0u8, 0u64);
    assert_eq(balance, 0u64);
    assert_eq(shares, 0u64);
    assert_eq(pending, 0u64);

    total_balance.set(0u8, microcredits);
    total_shares.set(0u8, microcredits);
    delegator_shares.set(ADMIN, microcredits);
  }

  transition set_commission_percent(commission_rate: u128) {
    assert_eq(self.signer, ADMIN);
    assert(commission_rate < PRECISION_UNSIGNED);
    assert(commission_rate < MAX_COMMISSION_RATE);

    return then finalize(commission_rate);
  }

  finalize set_commission_percent(new_commission_rate: u128) {
    // Ensure program is initialized
    let initialized: u8 = is_initalized.get_or_use(0u8, 0u8);
    assert_eq(initialized, 1u8);

    /** Claim Existing Commission Block */
    let current_state: u8 = state.get(0u8);
    assert_eq(current_state, 0u8);

    // Distribute shares for new commission
    let bonded: u64 = 0u64; // credits.aleo/bonded.get(CORE_PROTOCOL);
    let current_balance: u64 = total_balance.get(0u8);
    let current_shares: u64 = total_shares.get(0u8);
    let rewards: u64 = bonded - current_balance;
    let commission_rate: u128 = commission_percent.get(0u8);
    let new_commission: u64 = rewards > 0u64 ? get_commission(rewards as u128, commission_rate) : 0u64;
    current_balance += rewards - new_commission;

    let new_commission_shares: u64 = calculate_new_shares(current_balance as u128, new_commission as u128, current_shares as u128);
    let current_commission: u64 = delegator_shares.get_or_use(ADMIN, 0u64);
    delegator_shares.set(ADMIN, current_commission + new_commission_shares);

    total_shares.set(0u8, current_shares + new_commission_shares);
    total_balance.set(0u8, current_balance + new_commission);

    /** End Claim Existing Commision Block */

    commission_percent.set(0u8, new_commission_rate);
  }

  // Update the validator address, to be applied automatically on the next bond_all call
  transition update_validator(validator_address: address) {
    assert_eq(self.signer, ADMIN);

    return then finalize(validator_address);
  }

  finalize update_validator(validator_address: address) {
    // Ensure program is initialized
    let initialized: u8 = is_initalized.get_or_use(0u8, 0u8);
    assert_eq(initialized, 1u8);

    validator.set(1u8, validator_address);
  }

  transition unbond_all(pool_balance: u64) {
    assert_eq(self.signer, ADMIN);
    credits.aleo/unbond_public(pool_balance);

    return then finalize();
  }

  finalize unbond_all() {
    // Ensure program is initialized
    let initialized: u8 = is_initalized.get_or_use(0u8, 0u8);
    assert_eq(initialized, 1u8);

    /** Claim Existing Commission Block */
    let current_state: u8 = state.get(0u8);
    assert_eq(current_state, 0u8);

    // Distribute shares for new commission
    let bonded: u64 = 0u64; // credits.aleo/bonded.get(CORE_PROTOCOL);
    let current_balance: u64 = total_balance.get(0u8);
    let current_shares: u64 = total_shares.get(0u8);
    let rewards: u64 = bonded - current_balance;
    let commission_rate: u128 = commission_percent.get(0u8);
    let new_commission: u64 = rewards > 0u64 ? get_commission(rewards as u128, commission_rate) : 0u64;
    current_balance += rewards - new_commission;

    let new_commission_shares: u64 = calculate_new_shares(current_balance as u128, new_commission as u128, current_shares as u128);
    let current_commission: u64 = delegator_shares.get_or_use(ADMIN, 0u64);
    delegator_shares.set(ADMIN, current_commission + new_commission_shares);

    total_shares.set(0u8, current_shares + new_commission_shares);
    total_balance.set(0u8, current_balance + new_commission);

    /** End Claim Existing Commision Block */


    state.set(0u8, 1u8);
  }

  // Permissionless call to claim all of the rewards
  transition claim_all() {
    credits.aleo/claim_unbond_public();

    return then finalize();
  }

  finalize claim_all() {
    // Ensure program is initialized
    let initialized: u8 = is_initalized.get_or_use(0u8, 0u8);
    assert_eq(initialized, 1u8);

    let current_state: u8 = state.get(0u8);
    assert_eq(current_state, 1u8);

    state.set(0u8, 2u8);
    current_batch_height.remove(0u8);
  }

  transition bond_all(validator_address: address, amount: u64) {
    // Call will fail if there is any balance still bonded to another validator
    credits.aleo/bond_public(validator_address, amount);

    return then finalize(validator_address, amount);
  }

  finalize bond_all(validator_address: address, amount: u64) {
    // Ensure program is initialized
    let initialized: u8 = is_initalized.get_or_use(0u8, 0u8);
    assert_eq(initialized, 1u8);

    let current_state: u8 = state.get(0u8);
    // Bonding allowed during normal operations or after full unbonding
    assert(current_state == 0u8 || current_state == 2u8);

    let unbonding_balance: u64 = 0u64; // credits.aleo/unbonding.get(CORE_PROTOCOL);
    assert_eq(unbonding_balance, 0u64);

    let account_balance: u64 = 0u64; // credits.aleo/account.get(CORE_PROTOCOL);
    let pending_withdrawals: u64 = pending_withdrawal.get(0u8);
    let available_balance: u64 = account_balance - pending_withdrawals;
    assert(amount <= available_balance);

    // Ensure the updated validator is used
    let new_valdiator = validator.get_or_use(1u8, NULL_ADDRESS);
    let existing_validator = validator.get(0u8);
    let next_validator = new_validator == NULL_ADDRESS ? existing_validator : new_validator;
    assert_eq(next_validator, validator_address);

    // Set validator and state in case this was part of a validator change
    validator.set(0u8, validator_address);
    validator.set(1u8, NULL_ADDRESS);
    state.set(0u8, 0u8);
  }

  transition claim_commission() {
    assert_eq(self.signer, ADMIN);
    return then finalize();
  }

  finalize claim_commission() {
    // Ensure program is initialized
    let initialized: u8 = is_initalized.get_or_use(0u8, 0u8);
    assert_eq(initialized, 1u8);

    let current_state: u8 = state.get(0u8);
    assert_eq(current_state, 0u8);

    // Distribute shares for new commission
    let bonded: u64 = 0u64; // credits.aleo/bonded.get(CORE_PROTOCOL);
    let current_balance: u64 = total_balance.get(0u8);
    let current_shares: u64 = total_shares.get(0u8);
    let rewards: u64 = bonded - current_balance;
    let commission_rate: u128 = commission_percent.get(0u8);
    let new_commission: u64 = rewards > 0u64 ? get_commission(rewards as u128, commission_rate) : 0u64;
    current_balance += rewards - new_commission;

    let new_commission_shares: u64 = calculate_new_shares(current_balance as u128, new_commission as u128, current_shares as u128);
    let current_commission: u64 = delegator_shares.get_or_use(ADMIN, 0u64);
    delegator_shares.set(ADMIN, current_commission + new_commission_shares);

    total_shares.set(0u8, current_shares + new_commission_shares);
    total_balance.set(0u8, current_balance + new_commission);
  }

  inline get_commission(
    rewards: u128,
    commission_rate: u128,
  ) -> u64 {
    let commission: u128 = rewards * commission_rate / PRECISION_UNSIGNED;
    let commission_64: u64 = commission as u64;
    return commission_64;
  }

  inline calculate_new_shares(balance: u128, deposit: u128, shares: u128) -> u64 {
    let balance_safe: u128 = balance > 0u128 ? balance : 1u128;
    let pool_ratio: u128 = ((shares * PRECISION_UNSIGNED) / balance_safe);
    let new_total_shares: u128 = (balance + deposit) * pool_ratio;
    let diff: u128 = (new_total_shares / PRECISION_UNSIGNED) - shares;
    let shares_to_mint: u64 = balance > 0u128 ? diff as u64 : deposit as u64;
    return shares_to_mint;
  }

  transition deposit_public(
    input_record: credits.aleo/credits,
    microcredits: u64,
    validator_address: address,
    expected_shares: u64,
    minimum_shares: u64
  ) -> credits.aleo/credits {
    // Must be a credits record because credits.aleo uses self.caller for transfers
    let updated_record: credits.aleo/credits = credits.aleo/transfer_private_to_public(input_record, CORE_PROTOCOL, microcredits);

    return (updated_record) then finalize(self.caller, microcredits, validator_address, expected_shares, minimum_shares);
  }

  finalize deposit_public(
    caller: address,
    microcredits: u64,
    validator_address: address,
    expected_shares: u64,
    minimum_shares: u64
  ) {
    // Ensure program is initialized
    let initialized: u8 = is_initalized.get_or_use(0u8, 0u8);
    assert_eq(initialized, 1u8);

    let stored_validator: address = validator.get(0u8);
    assert_eq(validator_address, stored_validator);

    // Distribute shares for new commission
    let bonded: u64 = 0u64; // credits.aleo/bonded.get(CORE_PROTOCOL);
    let current_balance: u64 = total_balance.get(0u8);
    let current_shares: u64 = total_shares.get(0u8);
    let rewards: u64 = bonded - current_balance;
    let commission_rate: u128 = commission_percent.get(0u8);
    let new_commission: u64 = rewards > 0u64 ? get_commission(rewards as u128, commission_rate) : 0u64;
    current_balance += rewards - new_commission;

    let new_commission_shares: u64 = calculate_new_shares(current_balance as u128, new_commission as u128, current_shares as u128);
    let current_commission: u64 = delegator_shares.get_or_use(ADMIN, 0u64);
    delegator_shares.set(ADMIN, current_commission + new_commission_shares);

    current_shares += new_commission_shares;
    current_balance += new_commission;

    // Calculate mint for deposit
    let new_shares: u64 = calculate_new_shares(current_balance as u128, microcredits as u128, current_shares as u128);

    // Ensure mint amount is valid
    assert(new_shares >= 1u64);
    assert(new_shares >= minimum_shares);
    assert(new_shares <= expected_shares);

    // Update delegator_shares mapping
    let shares: u64 = delegator_shares.get_or_use(caller, 0u64);
    delegator_shares.set(caller, shares + new_shares);

    // Update total shares
    total_shares.set(0u8, current_shares + new_shares);

    // Update total_balance
    total_balance.set(0u8, current_balance + microcredits);
  }

  transition withdraw_public(withdrawal_shares: u64, total_withdrawal: u64) {
    credits.aleo/unbond_public(total_withdrawal);

    return then finalize(withdrawal_shares, total_withdrawal, self.caller);
  }

  finalize withdraw_public(withdrawal_shares: u64, total_withdrawal: u64, owner: address) {
    // Ensure program is initialized
    let initialized: u8 = is_initalized.get_or_use(0u8, 0u8);
    assert_eq(initialized, 1u8);

    let current_state: u8 = state.get(0u8);
    assert_eq(current_state, 0u8);

    // Assert that they don't have any pending withdrawals
    let currently_withdrawing: bool = withdrawals.contains(owner);
    assert_eq(currently_withdrawing, false);

    // Determine if the withdrawal can fit into the current batch
    let current_batch: u32 = current_batch_height.get_or_use(0u8, 0u32);
    let min_claim_height: u32 = block.height + UNBONDING_PERIOD;
    let new_batch: bool = current_batch == 0u32;
    let unbonding_allowed: bool = new_batch || current_batch >= min_claim_height;
    assert(unbonding_allowed);

    // Assert that they have enough to withdraw
    let delegator_balance: u64 = delegator_shares.get(owner);
    assert(delegator_balance >= withdrawal_shares);

    // Distribute shares for new commission
    let bonded: u64 = 0u64; // credits.aleo/bonded.get(CORE_PROTOCOL);
    let current_balance: u64 = total_balance.get(0u8);
    let current_shares: u64 = total_shares.get(0u8);
    let rewards: u64 = bonded - current_balance;
    let commission_rate: u128 = commission_percent.get(0u8);
    let new_commission: u64 = rewards > 0u64 ? get_commission(rewards as u128, commission_rate) : 0u64;
    current_balance += rewards - new_commission;

    let new_commission_shares: u64 = calculate_new_shares(current_balance as u128, new_commission as u128, current_shares as u128);
    let current_commission: u64 = delegator_shares.get_or_use(ADMIN, 0u64);
    delegator_shares.set(ADMIN, current_commission + new_commission_shares);

    current_shares += new_commission_shares;
    current_balance += new_commission;

    // Calculate withdrawal amount
    let withdraw_ratio: u128 = (withdrawal_shares as u128 * PRECISION_UNSIGNED) / current_shares as u128;
    let withdraw_calculation: u128 = (current_balance as u128 * withdraw_ratio) / PRECISION_UNSIGNED;

    // If the calculated withdrawal amount is greater than total_withdrawal, the excess will stay in the pool
    assert(withdraw_calculation >= total_withdrawal as u128);

    // Update withdrawals mappings
    let batch_height: u32 = new_batch ? get_new_batch_height(block.height) : current_batch;
    current_batch_height.set(0u8, batch_height);
    let withdrawal: withdrawal_state = withdrawal_state {
      microcredits: total_withdrawal,
      claim_block: batch_height
    };
    withdrawals.set(owner, withdrawal);

    // Update pending withdrawal
    let currently_pending: u64 = pending_withdrawal.get(0u8);
    pending_withdrawal.set(0u8, currently_pending + total_withdrawal);

    // Update total balance
    total_balance.set(0u8, current_balance - total_withdrawal);

    // Update total shares
    total_shares.set(0u8, current_shares - withdrawal_shares);

    // Update delegator_shares mapping
    delegator_shares.set(owner, delegator_balance - withdrawal_shares);
  }

  inline get_new_batch_height(height: u32) -> u32 {
    let rounded_down: u32 = (height) / 1_000u32 * 1_000u32;
    let rounded_up: u32 = rounded_down + 1_000u32;
    return rounded_up;
  }

  transition withdraw_claim(amount: u64) {
    credits.aleo/claim_unbond_public();
    credits.aleo/transfer_public(self.caller, amount);

    return then finalize(self.caller, amount);
  }

  finalize withdraw_claim(owner: address, amount: u64) {
    // Ensure program is initialized
    let initialized: u8 = is_initalized.get_or_use(0u8, 0u8);
    assert_eq(initialized, 1u8);

    let withdrawal: withdrawal_state = withdrawals.get(owner);
    assert(block.height >= withdrawal.claim_block);
    assert_eq(withdrawal.microcredits, amount);

    // Allow unbonding now that credits have been claimed
    current_batch_height.remove(0u8);

    // Remove withdrawal from mapping
    withdrawals.remove(owner);

    // Update pending withdrawal
    let currently_pending: u64 = pending_withdrawal.get(0u8);
    pending_withdrawal.set(0u8, currently_pending - amount);
  }
}