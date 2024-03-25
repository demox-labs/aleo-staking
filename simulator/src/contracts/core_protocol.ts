import { token } from './ale';
import { credits } from './credits';
import { axelProgram } from './axel';
import { aleProgram } from './ale';
import { creditsProgram } from './credits';
import { delegator5Program } from './delegator5';
import { delegator4Program } from './delegator4';
import { delegator3Program } from './delegator3';
import { delegator2Program } from './delegator2';
import { delegator1Program } from './delegator1';
import { oracleProgram } from './oracle';

import assert from 'assert';
// interfaces
export interface state {
  stake: bigint;
  reward: bigint;
  performance: bigint;
  unbond_amount: bigint;
  validator: string;
  ideal_portion: bigint;
}
export class core_protocolProgram {
  caller: string = "not set";
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  // params
  WITHDRAW_FEE = BigInt("30");
  WITHDRAW_WAIT_MINIMUM = BigInt("15_000");
  withdraw_pool: Map<bigint, bigint> = new Map();
  protocol_state: Map<bigint, bigint> = new Map();
  last_rebalance_height: Map<bigint, bigint> = new Map();
  core_protocol_balance: Map<bigint, bigint> = new Map();
  delegator_state: Map<string, state> = new Map();
  delegator_performance: Map<string, bigint> = new Map();
  portion_delegator: Map<bigint, string> = new Map();
  boost_pool: Map<string, bigint> = new Map();
  AXEL = "aleo1fwwj46afvuv7n940zjmkn0vjp3fz3n5vnmz7gqgafxmzuym0w5gqad7hxq";
  ALE = "aleo1zpy3xyaf40uqt6v42wm8f9kzp7rhzrjy34kv5yyx3va4r9hgcsxstggn0q";
  CORE_PROTOCOL = "aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0";
  DELEGATOR_5 = "aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n";
  DELEGATOR_4 = "aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k";
  DELEGATOR_3 = "aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt";
  DELEGATOR_2 = "aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc";
  DELEGATOR_1 = "aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4";
  MINIMUM_BOOST = BigInt("5_000_000");
  PROFITABILITY_TIMEFRAME = BigInt("40_000");
  MINIMUM_BOND_POOL = BigInt("125_000_000");
  PORTION_5 = BigInt("80");
  PORTION_4 = BigInt("110");
  PORTION_3 = BigInt("160");
  PORTION_2 = BigInt("250");
  PORTION_1 = BigInt("400");
  PRECISION_UNSIGNED = BigInt("1000");
  PRECISION = BigInt("1000");
  axel: axelProgram;
  ale: aleProgram;
  credits: creditsProgram;
  delegator5: delegator5Program;
  delegator4: delegator4Program;
  delegator3: delegator3Program;
  delegator2: delegator2Program;
  delegator1: delegator1Program;
  oracle: oracleProgram;
  constructor(
    // constructor args
    axelContract: axelProgram,
    aleContract: aleProgram,
    creditsContract: creditsProgram,
    delegator5Contract: delegator5Program,
    delegator4Contract: delegator4Program,
    delegator3Contract: delegator3Program,
    delegator2Contract: delegator2Program,
    delegator1Contract: delegator1Program,
    oracleContract: oracleProgram,
  ) {
    // constructor body
    this.axel = axelContract;
    this.ale = aleContract;
    this.credits = creditsContract;
    this.delegator5 = delegator5Contract;
    this.delegator4 = delegator4Contract;
    this.delegator3 = delegator3Contract;
    this.delegator2 = delegator2Contract;
    this.delegator1 = delegator1Contract;
    this.oracle = oracleContract;
  }
      
// 1 -> 40% of the stake
// 2 -> 25% of the stake
// 3 -> 16% of the stake
// 4 -> 11% of the stake
// 5 -> 8% of the stake
    
  //program core_protocol.aleo {    
    
    
    
    
    
    
// 0u8 -> total amount of publicly held aleo in the protocol
// should increase with deposits and decrease with bonding those deposits
// should increase with boosting and decrease with final rebonding in the rebalance
// 1u8 -> total amount of aleo pending withdraw
    
// u8 -> the height at which the last rebalance completed
// should be updated at the end of the rebalance
// used to estimate rewards earned since rebalancing
    
// protocol controls
// 0u8 ->
// 0u8: protocol functioning as normal
// 1u8: upcoming protocol rebalance
// 2u8: upcoming protocol rebalance unbonding
// 3u8: upcoming protocol mint rewards and protocol fee
// 4u8: upcoming protocol rebalance redistribution
// 10u8: protocol withdraw unbonding in progress
    
  boost(
    boostee: string,
    amount: bigint,
    input_record: credits,
  ) {
// the protocol itself cannot be boosted, as this counts the total boosts in the pool
    assert(boostee !== this.CORE_PROTOCOL);
// minimum boost amount?
    assert(amount > this.MINIMUM_BOOST);
    this.credits.caller = "core_protocol.aleo";
    this.credits.transfer_private_to_public(input_record, this.CORE_PROTOCOL, amount);
    return this.finalize_boost(boostee, amount);
    }
    
  finalize_boost(
    boostee: string,
    amount: bigint,
  ) {
// only boost during normal operations
    let current_state: bigint = this.protocol_state.get(BigInt("0"))!;
    assert(current_state === BigInt("0"));
    
    let current_boost: bigint = this.boost_pool.get(boostee) || BigInt("0");
    let new_boost: bigint = current_boost + amount;
    this.boost_pool.set(boostee, new_boost);
    
    let current_total_boost: bigint = this.boost_pool.get(this.CORE_PROTOCOL) || BigInt("0");
    let new_total_boost: bigint = current_total_boost + amount;
    
    this.boost_pool.set(this.CORE_PROTOCOL, new_boost);
    
    let current_total_protocol_balance: bigint = this.core_protocol_balance.get(BigInt("0")) || BigInt("0");
    let new_total_protocol_balance: bigint = current_total_protocol_balance + amount;
    this.core_protocol_balance.set(BigInt("0"), new_total_protocol_balance);
    }
    
  clear_boost_pool(
    boostee: string,
  ) {
    assert(boostee !== this.CORE_PROTOCOL);
    return this.finalize_clear_boost_pool(boostee);
    }
    
  finalize_clear_boost_pool(
    boostee: string,
  ) {
// clearing the boost pool may only happen when the protocol is waiting to claim its unbonded stakes
    let current_state: bigint = this.protocol_state.get(BigInt("0"))!;
    let clear_allowed: boolean = current_state == BigInt("0") || current_state == BigInt("2") || current_state == BigInt("3");
    assert(clear_allowed);
    
    let boosted_amount: bigint = this.boost_pool.get(boostee) || BigInt("0");
    this.boost_pool.set(boostee, BigInt("0"));
    
    let current_total_boost: bigint = this.boost_pool.get(this.CORE_PROTOCOL) || BigInt("0");
    let new_total_boost: bigint = current_total_boost - boosted_amount;
    this.boost_pool.set(this.CORE_PROTOCOL, new_total_boost);
    }
    
// 15 is the max amount we can clear in a single transaction without running into constraint limits
  clear_boost_pool_bulk(
    boostees: string[],
  ) {
    return this.finalize_clear_boost_pool_bulk(boostees);
    }
    
  finalize_clear_boost_pool_bulk(
    boostees: string[],
  ) {
// clearing the boost pool may only happen when the protocol is waiting to claim its unbonded stakes
    let current_state: bigint = this.protocol_state.get(BigInt("0"))!;
    let clear_allowed: boolean = current_state == BigInt("0") || current_state == BigInt("2") || current_state == BigInt("3") || current_state == BigInt("4");
    assert(clear_allowed);
    
    let new_total_boost: bigint = this.boost_pool.get(this.CORE_PROTOCOL) || BigInt("0");
    for (let i: number = 0; i < 15; i++) {
    let boostee: string = boostees[i];
    assert(boostee !== this.CORE_PROTOCOL);
    let boosted_amount: bigint = this.boost_pool.get(boostee) || BigInt("0");
    this.boost_pool.set(boostee, BigInt("0"));
    
    new_total_boost = new_total_boost - boosted_amount;
    }
    
    this.boost_pool.set(this.CORE_PROTOCOL, new_total_boost);
    }
    
  prep_rebalance(
    current_validators: string[],
    new_validators: string[],
    performances: bigint[],
    unbond_amounts: bigint[],
    reward_amounts: bigint[],
    ideal_portions: bigint[],
  ) {
    this.oracle.caller = "core_protocol.aleo";
    this.oracle.confirm_data(new_validators, performances, reward_amounts);
    
    return this.finalize_prep_rebalance(
    current_validators,
    new_validators,
    performances,
    unbond_amounts,
    reward_amounts,
    ideal_portions
    );
    }
    
  finalize_prep_rebalance(
    current_validators: string[],
    new_validators: string[],
    performances: bigint[],
    unbond_amounts: bigint[],
    reward_amounts: bigint[],
    ideal_portions: bigint[],
  ) {
    let d1_state: state = this.delegator_state.get(this.DELEGATOR_1)!;
    let d2_state: state = this.delegator_state.get(this.DELEGATOR_2)!;
    let d3_state: state = this.delegator_state.get(this.DELEGATOR_3)!;
    let d4_state: state = this.delegator_state.get(this.DELEGATOR_4)!;
    let d5_state: state = this.delegator_state.get(this.DELEGATOR_5)!;
    
// ********** ASSERT THAT THE CURRENT VALIDATOR SET MATCHES **********
    assert(current_validators[0] === d1_state.validator);
    assert(current_validators[1] === d2_state.validator);
    assert(current_validators[2] === d3_state.validator);
    assert(current_validators[3] === d4_state.validator);
    assert(current_validators[4] === d5_state.validator);
    
// ********** ENSURE THAT THE REBALANCING AMOUNTS ARE CORRECT **********
    let d1_stake: bigint = d1_state.stake;
    let d2_stake: bigint = d2_state.stake;
    let d3_stake: bigint = d3_state.stake;
    let d4_stake: bigint = d4_state.stake;
    let d5_stake: bigint = d5_state.stake;
    
    let d1_balance: bigint = d1_stake + reward_amounts[0];
    let d2_balance: bigint = d2_stake + reward_amounts[1];
    let d3_balance: bigint = d3_stake + reward_amounts[2];
    let d4_balance: bigint = d4_stake + reward_amounts[3];
    let d5_balance: bigint = d5_stake + reward_amounts[4];
    let total_balance: bigint = d1_balance + d2_balance + d3_balance + d4_balance + d5_balance;
    
    let d1_num: bigint = d1_balance * this.PRECISION;
    let d2_num: bigint = d2_balance * this.PRECISION;
    let d3_num: bigint = d3_balance * this.PRECISION;
    let d4_num: bigint = d4_balance * this.PRECISION;
    let d5_num: bigint = d5_balance * this.PRECISION;
    
    let d1_quotient: bigint = d1_num / total_balance;
    let d2_quotient: bigint = d2_num / total_balance;
    let d3_quotient: bigint = d3_num / total_balance;
    let d4_quotient: bigint = d4_num / total_balance;
    let d5_quotient: bigint = d5_num / total_balance;
    
    let d1_diff: bigint = d1_quotient - ideal_portions[0];
    let d2_diff: bigint = d2_quotient - ideal_portions[1];
    let d3_diff: bigint = d3_quotient - ideal_portions[2];
    let d4_diff: bigint = d4_quotient - ideal_portions[3];
    let d5_diff: bigint = d5_quotient - ideal_portions[4];
    
    let d1_diff_pos: boolean = d1_diff > BigInt("0");
    let d2_diff_pos: boolean = d2_diff > BigInt("0");
    let d3_diff_pos: boolean = d3_diff > BigInt("0");
    let d4_diff_pos: boolean = d4_diff > BigInt("0");
    let d5_diff_pos: boolean = d5_diff > BigInt("0");
    
    let d1_transfer_amt: bigint = d1_diff * total_balance / this.PRECISION;
    let d2_transfer_amt: bigint = d2_diff * total_balance / this.PRECISION;
    let d3_transfer_amt: bigint = d3_diff * total_balance / this.PRECISION;
    let d4_transfer_amt: bigint = d4_diff * total_balance / this.PRECISION;
    let d5_transfer_amt: bigint = d5_diff * total_balance / this.PRECISION;
    
    let d1_transfer_credits: bigint = d1_diff_pos ? d1_transfer_amt : BigInt("0");
    let d2_transfer_credits: bigint = d2_diff_pos ? d2_transfer_amt : BigInt("0");
    let d3_transfer_credits: bigint = d3_diff_pos ? d3_transfer_amt : BigInt("0");
    let d4_transfer_credits: bigint = d4_diff_pos ? d4_transfer_amt : BigInt("0");
    let d5_transfer_credits: bigint = d5_diff_pos ? d5_transfer_amt : BigInt("0");
    
    assert(d1_transfer_credits === unbond_amounts[0]);
    assert(d2_transfer_credits === unbond_amounts[1]);
    assert(d3_transfer_credits === unbond_amounts[2]);
    assert(d4_transfer_credits === unbond_amounts[3]);
    assert(d5_transfer_credits === unbond_amounts[4]);
    
// ********** CALCULATE IF IT IS PROFITABLE TO REBALANCE **********
    let rewards_from_last_period: bigint = reward_amounts[0] + reward_amounts[1] + reward_amounts[2] + reward_amounts[3] + reward_amounts[4];
    let last_period_duration: bigint = (this.block.height - this.last_rebalance_height.get(BigInt("0")) || BigInt("0"));
    let current_stake: bigint = d1_state.stake + d2_state.stake + d3_state.stake + d4_state.stake + d5_state.stake;
    let last_period_weekly_yield: bigint = this.PRECISION_UNSIGNED * rewards_from_last_period * this.PROFITABILITY_TIMEFRAME / (last_period_duration * current_stake);
// compound once
    let current_distribution_projected_yield: bigint = total_balance * last_period_weekly_yield / this.PRECISION_UNSIGNED;
    
    let projected_stake_after_rebalance: bigint = current_stake + this.core_protocol_balance.get(BigInt("0")) || BigInt("0") + rewards_from_last_period;
    let projected_weekly_performance: bigint = ideal_portions[0] * performances[0] + ideal_portions[1] * performances[1] + ideal_portions[2] * performances[2] + ideal_portions[3] * performances[3] + ideal_portions[4] * performances[4];
    let projected_weekly_yield: bigint = projected_weekly_performance * projected_stake_after_rebalance / this.PRECISION_UNSIGNED;
    assert(projected_weekly_yield >= current_distribution_projected_yield);
    
// ********** UPDATE DELEGATOR REWARD, PERFORMANCE, UNBOND, IDEAL PORTION STATES **********
    let new_d1_state: state = {
    stake: d1_state.stake,
    reward: reward_amounts[0],
    performance: performances[0],
    unbond_amount: unbond_amounts[0],
    validator: d1_state.validator,
    ideal_portion: ideal_portions[0]
    };
    
    let new_d2_state: state = {
    stake: d2_state.stake,
    reward: reward_amounts[1],
    performance: performances[1],
    unbond_amount: unbond_amounts[1],
    validator: d2_state.validator,
    ideal_portion: ideal_portions[1]
    };
    
    let new_d3_state: state = {
    stake: d3_state.stake,
    reward: reward_amounts[2],
    performance: performances[2],
    unbond_amount: unbond_amounts[2],
    validator: d3_state.validator,
    ideal_portion: ideal_portions[2]
    };
    
    let new_d4_state: state = {
    stake: d4_state.stake,
    reward: reward_amounts[3],
    performance: performances[3],
    unbond_amount: unbond_amounts[3],
    validator: d4_state.validator,
    ideal_portion: ideal_portions[3]
    };
    
    let new_d5_state: state = {
    stake: d5_state.stake,
    reward: reward_amounts[4],
    performance: performances[4],
    unbond_amount: unbond_amounts[4],
    validator: d5_state.validator,
    ideal_portion: ideal_portions[4]
    };
    
    this.delegator_state.set(this.DELEGATOR_1, new_d1_state);
    this.delegator_state.set(this.DELEGATOR_2, new_d2_state);
    this.delegator_state.set(this.DELEGATOR_3, new_d3_state);
    this.delegator_state.set(this.DELEGATOR_4, new_d4_state);
    this.delegator_state.set(this.DELEGATOR_5, new_d5_state);
    
// ********** ENSURE THAT THE IDEAL PORTIONS ARE SET BASED ON PERFORMANCE **********
    this.portion_delegator.set(ideal_portions[0], this.DELEGATOR_1);
    this.portion_delegator.set(ideal_portions[1], this.DELEGATOR_2);
    this.portion_delegator.set(ideal_portions[2], this.DELEGATOR_3);
    this.portion_delegator.set(ideal_portions[3], this.DELEGATOR_4);
    this.portion_delegator.set(ideal_portions[4], this.DELEGATOR_5);
    
    this.delegator_performance.set(this.DELEGATOR_1, performances[0]);
    this.delegator_performance.set(this.DELEGATOR_2, performances[1]);
    this.delegator_performance.set(this.DELEGATOR_3, performances[2]);
    this.delegator_performance.set(this.DELEGATOR_4, performances[3]);
    this.delegator_performance.set(this.DELEGATOR_5, performances[4]);
    
    let largest_delegator: string = this.portion_delegator.get(this.PORTION_1)!;
    let second_delegator: string = this.portion_delegator.get(this.PORTION_2)!;
    let third_delegator: string = this.portion_delegator.get(this.PORTION_3)!;
    let fourth_delegator: string = this.portion_delegator.get(this.PORTION_4)!;
    let smallest_delegator: string = this.portion_delegator.get(this.PORTION_5)!;
    
    let largest_delegator_performance: bigint = this.delegator_performance.get(largest_delegator)!;
    let second_delegator_performance: bigint = this.delegator_performance.get(second_delegator)!;
    let third_delegator_performance: bigint = this.delegator_performance.get(third_delegator)!;
    let fourth_delegator_performance: bigint = this.delegator_performance.get(fourth_delegator)!;
    let smallest_delegator_performance: bigint = this.delegator_performance.get(smallest_delegator)!;
    
    assert(largest_delegator_performance >= second_delegator_performance);
    assert(second_delegator_performance >= third_delegator_performance);
    assert(third_delegator_performance >= fourth_delegator_performance);
    assert(fourth_delegator_performance >= smallest_delegator_performance);
    
// *********** CHECK & UPDATE PROTOCOL STATE **********
// prep rebalance is allowed to be called multiple times
    assert(this.protocol_state.get(BigInt("0"))! <= BigInt("1"));
    this.protocol_state.set(BigInt("0"), BigInt("1"));
    }
    
  rebalance_unbond(
    unbond_amounts: bigint[],
    reward_amounts: bigint[],
  ) {
    this.delegator1.caller = "core_protocol.aleo";
    this.delegator1.unbond(unbond_amounts[0]);
    this.delegator2.caller = "core_protocol.aleo";
    this.delegator2.unbond(unbond_amounts[1]);
    this.delegator3.caller = "core_protocol.aleo";
    this.delegator3.unbond(unbond_amounts[2]);
    this.delegator4.caller = "core_protocol.aleo";
    this.delegator4.unbond(unbond_amounts[3]);
    this.delegator5.caller = "core_protocol.aleo";
    this.delegator5.unbond(unbond_amounts[4]);
    
    return this.finalize_rebalance_unbond(
    unbond_amounts,
    reward_amounts
    );
    }
    
  finalize_rebalance_unbond(
    unbond_amounts: bigint[],
    reward_amounts: bigint[],
  ) {
    let d1_state: state = this.delegator_state.get(this.DELEGATOR_1)!;
    let d2_state: state = this.delegator_state.get(this.DELEGATOR_2)!;
    let d3_state: state = this.delegator_state.get(this.DELEGATOR_3)!;
    let d4_state: state = this.delegator_state.get(this.DELEGATOR_4)!;
    let d5_state: state = this.delegator_state.get(this.DELEGATOR_5)!;
    
// ********** ASSERT INPUTS AND STATE **********
    assert(unbond_amounts[0] === d1_state.unbond_amount);
    assert(unbond_amounts[1] === d2_state.unbond_amount);
    assert(unbond_amounts[2] === d3_state.unbond_amount);
    assert(unbond_amounts[3] === d4_state.unbond_amount);
    assert(unbond_amounts[4] === d5_state.unbond_amount);
    
    assert(reward_amounts[0] === d1_state.reward);
    assert(reward_amounts[1] === d2_state.reward);
    assert(reward_amounts[2] === d3_state.reward);
    assert(reward_amounts[3] === d4_state.reward);
    assert(reward_amounts[4] === d5_state.reward);
    
// ********** UPDATE DELEGATOR STATES **********
    let new_d1_state: state = {
    stake: d1_state.stake - unbond_amounts[0] + reward_amounts[0],
    reward: d1_state.reward,
    performance: d1_state.performance,
    unbond_amount: unbond_amounts[0],
    validator: d1_state.validator,
    ideal_portion: d1_state.ideal_portion
    };
    
    let new_d2_state: state = {
    stake: d2_state.stake - unbond_amounts[1] + reward_amounts[1],
    reward: d2_state.reward,
    performance: d2_state.performance,
    unbond_amount: unbond_amounts[1],
    validator: d2_state.validator,
    ideal_portion: d2_state.ideal_portion
    };
    
    let new_d3_state: state = {
    stake: d3_state.stake - unbond_amounts[2] + reward_amounts[2],
    reward: d3_state.reward,
    performance: d3_state.performance,
    unbond_amount: unbond_amounts[2],
    validator: d3_state.validator,
    ideal_portion: d3_state.ideal_portion
    };
    
    let new_d4_state: state = {
    stake: d4_state.stake - unbond_amounts[3] + reward_amounts[3],
    reward: d4_state.reward,
    performance: d4_state.performance,
    unbond_amount: unbond_amounts[3],
    validator: d4_state.validator,
    ideal_portion: d4_state.ideal_portion
    };
    
    let new_d5_state: state = {
    stake: d5_state.stake - unbond_amounts[4] + reward_amounts[4],
    reward: d5_state.reward,
    performance: d5_state.performance,
    unbond_amount: unbond_amounts[4],
    validator: d5_state.validator,
    ideal_portion: d5_state.ideal_portion
    };
    
    this.delegator_state.set(this.DELEGATOR_1, new_d1_state);
    this.delegator_state.set(this.DELEGATOR_2, new_d2_state);
    this.delegator_state.set(this.DELEGATOR_3, new_d3_state);
    this.delegator_state.set(this.DELEGATOR_4, new_d4_state);
    this.delegator_state.set(this.DELEGATOR_5, new_d5_state);
    
// *********** UPDATE PROTOCOL STATE **********
    assert(this.protocol_state.get(BigInt("0"))! === BigInt("1"));
    this.protocol_state.set(BigInt("0"), BigInt("2"));
    }
    
  rebalance_collect_rewards(
    current_validators: string[],
    new_validators: string[],
    reward_amounts: bigint[],
    validator_mint_amounts: bigint[],
    total_ale_minted: bigint,
    total_ale_burned: bigint,
  ) {
    this.ale.caller = "core_protocol.aleo";
    this.ale.assert_totals(total_ale_minted, total_ale_burned);
    let total_ale_pool: bigint = total_ale_minted - total_ale_burned;
    
// Mint Ale to the validators
    this.ale.caller = "core_protocol.aleo";
    this.ale.mint_public(validator_mint_amounts[0], current_validators[0]);
    this.ale.caller = "core_protocol.aleo";
    this.ale.mint_public(validator_mint_amounts[1], current_validators[1]);
    this.ale.caller = "core_protocol.aleo";
    this.ale.mint_public(validator_mint_amounts[2], current_validators[2]);
    this.ale.caller = "core_protocol.aleo";
    this.ale.mint_public(validator_mint_amounts[3], current_validators[3]);
    this.ale.caller = "core_protocol.aleo";
    this.ale.mint_public(validator_mint_amounts[4], current_validators[4]);
    
// Mint Ale to the axel pool
    let fee_mint: bigint = validator_mint_amounts[0] + validator_mint_amounts[1] + validator_mint_amounts[2] + validator_mint_amounts[3] + validator_mint_amounts[4];
    this.ale.caller = "core_protocol.aleo";
    this.ale.mint_public(fee_mint, this.AXEL);
    return this.finalize_rebalance_collect_rewards(
    current_validators,
    new_validators,
    reward_amounts,
    validator_mint_amounts,
    total_ale_pool);
    }
    
  finalize_rebalance_collect_rewards(
    current_validators: string[],
    new_validators: string[],
    reward_amounts: bigint[],
    validator_mint_amounts: bigint[],
    total_ale_pool: bigint,
  ) {
    let d1_state: state = this.delegator_state.get(this.DELEGATOR_1)!;
    let d2_state: state = this.delegator_state.get(this.DELEGATOR_2)!;
    let d3_state: state = this.delegator_state.get(this.DELEGATOR_3)!;
    let d4_state: state = this.delegator_state.get(this.DELEGATOR_4)!;
    let d5_state: state = this.delegator_state.get(this.DELEGATOR_5)!;
    
// ********** ASSERT INPUTS AND STATE **********
    assert(current_validators[0] === d1_state.validator);
    assert(current_validators[1] === d2_state.validator);
    assert(current_validators[2] === d3_state.validator);
    assert(current_validators[3] === d4_state.validator);
    assert(current_validators[4] === d5_state.validator);
    
    assert(reward_amounts[0] === d1_state.reward);
    assert(reward_amounts[1] === d2_state.reward);
    assert(reward_amounts[2] === d3_state.reward);
    assert(reward_amounts[3] === d4_state.reward);
    assert(reward_amounts[4] === d5_state.reward);
    
// ********** ASSERT MINT AMOUNTS **********
    let v1_aleo_fee_precision: bigint = this.PRECISION_UNSIGNED * reward_amounts[0] / BigInt("20");
    let v2_aleo_fee_precision: bigint = this.PRECISION_UNSIGNED * reward_amounts[1] / BigInt("20");
    let v3_aleo_fee_precision: bigint = this.PRECISION_UNSIGNED * reward_amounts[2] / BigInt("20");
    let v4_aleo_fee_precision: bigint = this.PRECISION_UNSIGNED * reward_amounts[3] / BigInt("20");
    let v5_aleo_fee_precision: bigint = this.PRECISION_UNSIGNED * reward_amounts[4] / BigInt("20");
    let validator_total_fee_precision: bigint = v1_aleo_fee_precision + v2_aleo_fee_precision + v3_aleo_fee_precision + v4_aleo_fee_precision + v5_aleo_fee_precision;
    let validator_total_fee: bigint = (validator_total_fee_precision / this.PRECISION_UNSIGNED);
    let axel_fee: bigint = validator_total_fee;
    
    assert(validator_mint_amounts[0] * this.PRECISION_UNSIGNED === v1_aleo_fee_precision);
    assert(validator_mint_amounts[1] * this.PRECISION_UNSIGNED === v2_aleo_fee_precision);
    assert(validator_mint_amounts[2] * this.PRECISION_UNSIGNED === v3_aleo_fee_precision);
    assert(validator_mint_amounts[3] * this.PRECISION_UNSIGNED === v4_aleo_fee_precision);
    assert(validator_mint_amounts[4] * this.PRECISION_UNSIGNED === v5_aleo_fee_precision);
    
    let protocol_pending_withdraw_balance: bigint = this.core_protocol_balance.get(BigInt("1")) || BigInt("0");
    let pool_balance: bigint = this.core_protocol_balance.get(BigInt("0")) || BigInt("0");
    let total_aleo_after: bigint = pool_balance + d1_state.stake + d2_state.stake + d3_state.stake + d4_state.stake + d5_state.stake - protocol_pending_withdraw_balance;
    let total_aleo_before: bigint = total_aleo_after - validator_total_fee - axel_fee;
    
    let total_ale_minted: bigint = BigInt("2") * (validator_mint_amounts[0] + validator_mint_amounts[1] + validator_mint_amounts[2] + validator_mint_amounts[3] + validator_mint_amounts[4]);
    let total_ale_before: bigint = total_ale_pool;
    let total_ale_after: bigint = total_ale_before + total_ale_minted;
    
// aleo_before / aleo_after should equal ale_before / ale_after
// aleo_before * ale_after = aleo_after * ale_before
    
    let product_1: bigint = total_aleo_before * total_ale_after;
    let product_2: bigint = total_aleo_after * total_ale_before;
    assert(product_1 === product_2);
    
// ********** UPDATE DELEGATOR STATES **********
    let new_d1_state: state = {
    stake: d1_state.stake,
    reward: BigInt("0"),
    performance: d1_state.performance,
    unbond_amount: d1_state.unbond_amount,
    validator: new_validators[0],
    ideal_portion: d1_state.ideal_portion
    };
    
    let new_d2_state: state = {
    stake: d2_state.stake,
    reward: BigInt("0"),
    performance: d2_state.performance,
    unbond_amount: d2_state.unbond_amount,
    validator: new_validators[1],
    ideal_portion: d2_state.ideal_portion
    };
    
    let new_d3_state: state = {
    stake: d3_state.stake,
    reward: BigInt("0"),
    performance: d3_state.performance,
    unbond_amount: d3_state.unbond_amount,
    validator: new_validators[2],
    ideal_portion: d3_state.ideal_portion
    };
    
    let new_d4_state: state = {
    stake: d4_state.stake,
    reward: BigInt("0"),
    performance: d4_state.performance,
    unbond_amount: d4_state.unbond_amount,
    validator: new_validators[3],
    ideal_portion: d4_state.ideal_portion
    };
    
    let new_d5_state: state = {
    stake: d5_state.stake,
    reward: BigInt("0"),
    performance: d5_state.performance,
    unbond_amount: d5_state.unbond_amount,
    validator: new_validators[4],
    ideal_portion: d5_state.ideal_portion
    };
    
    this.delegator_state.set(this.DELEGATOR_1, new_d1_state);
    this.delegator_state.set(this.DELEGATOR_2, new_d2_state);
    this.delegator_state.set(this.DELEGATOR_3, new_d3_state);
    this.delegator_state.set(this.DELEGATOR_4, new_d4_state);
    this.delegator_state.set(this.DELEGATOR_5, new_d5_state);
    
// *********** UPDATE PROTOCOL STATE **********
    assert(this.protocol_state.get(BigInt("0"))! === BigInt("2"));
    this.protocol_state.set(BigInt("0"), BigInt("3"));
    }
    
  rebalance_claim_unbond(
    unbond_amounts: bigint[],
  ) {
// ********** CLAIM UNBOND AND SEND TO PROTOCOL ALEO POOL **********
// note -- in the case that a validator has forcibly unbonded a delegator,
// the fix_orphaned_delegator transition must be called
    this.delegator1.caller = "core_protocol.aleo";
    this.delegator1.claim_unbond();
    this.delegator1.caller = "core_protocol.aleo";
    this.delegator1.transfer_to_core_protocol(unbond_amounts[0]);
    
    this.delegator2.caller = "core_protocol.aleo";
    this.delegator2.claim_unbond();
    this.delegator2.caller = "core_protocol.aleo";
    this.delegator2.transfer_to_core_protocol(unbond_amounts[1]);
    
    this.delegator3.caller = "core_protocol.aleo";
    this.delegator3.claim_unbond();
    this.delegator3.caller = "core_protocol.aleo";
    this.delegator3.transfer_to_core_protocol(unbond_amounts[2]);
    
    this.delegator4.caller = "core_protocol.aleo";
    this.delegator4.claim_unbond();
    this.delegator4.caller = "core_protocol.aleo";
    this.delegator4.transfer_to_core_protocol(unbond_amounts[3]);
    
    this.delegator5.caller = "core_protocol.aleo";
    this.delegator5.claim_unbond();
    this.delegator5.caller = "core_protocol.aleo";
    this.delegator5.transfer_to_core_protocol(unbond_amounts[4]);
    
    return this.finalize_rebalance_claim_unbond(unbond_amounts);
    }
    
  finalize_rebalance_claim_unbond(
    unbond_amounts: bigint[],
  ) {
    let d1_state: state = this.delegator_state.get(this.DELEGATOR_1)!;
    let d2_state: state = this.delegator_state.get(this.DELEGATOR_2)!;
    let d3_state: state = this.delegator_state.get(this.DELEGATOR_3)!;
    let d4_state: state = this.delegator_state.get(this.DELEGATOR_4)!;
    let d5_state: state = this.delegator_state.get(this.DELEGATOR_5)!;
    
// ********** ASSERT INPUTS AND STATE **********
    assert(unbond_amounts[0] === d1_state.unbond_amount);
    assert(unbond_amounts[1] === d2_state.unbond_amount);
    assert(unbond_amounts[2] === d3_state.unbond_amount);
    assert(unbond_amounts[3] === d4_state.unbond_amount);
    assert(unbond_amounts[4] === d5_state.unbond_amount);
    
// ********** UPDATE DELEGATOR STATES **********
    let new_d1_state: state = {
    stake: d1_state.stake,
    reward: BigInt("0"),
    performance: d1_state.performance,
    unbond_amount: BigInt("0"),
    validator: d1_state.validator,
    ideal_portion: d1_state.ideal_portion
    };
    let new_d2_state: state = {
    stake: d2_state.stake,
    reward: BigInt("0"),
    performance: d2_state.performance,
    unbond_amount: BigInt("0"),
    validator: d2_state.validator,
    ideal_portion: d2_state.ideal_portion
    };
    let new_d3_state: state = {
    stake: d3_state.stake,
    reward: BigInt("0"),
    performance: d3_state.performance,
    unbond_amount: BigInt("0"),
    validator: d3_state.validator,
    ideal_portion: d3_state.ideal_portion
    };
    let new_d4_state: state = {
    stake: d4_state.stake,
    reward: BigInt("0"),
    performance: d4_state.performance,
    unbond_amount: BigInt("0"),
    validator: d4_state.validator,
    ideal_portion: d4_state.ideal_portion
    };
    let new_d5_state: state = {
    stake: d5_state.stake,
    reward: BigInt("0"),
    performance: d5_state.performance,
    unbond_amount: BigInt("0"),
    validator: d5_state.validator,
    ideal_portion: d5_state.ideal_portion
    };
    
    this.delegator_state.set(this.DELEGATOR_1, new_d1_state);
    this.delegator_state.set(this.DELEGATOR_2, new_d2_state);
    this.delegator_state.set(this.DELEGATOR_3, new_d3_state);
    this.delegator_state.set(this.DELEGATOR_4, new_d4_state);
    this.delegator_state.set(this.DELEGATOR_5, new_d5_state);
    
// *********** CHECK & UPDATE PROTOCOL STATE **********
    assert(this.protocol_state.get(BigInt("0"))! === BigInt("3"));
// rebalancing unbonding complete
    this.protocol_state.set(BigInt("0"), BigInt("4"));
    
    let current_total_protocol_balance: bigint = this.core_protocol_balance.get(BigInt("0")) || BigInt("0");
    let new_total_protocol_balance: bigint = current_total_protocol_balance + unbond_amounts[0] + unbond_amounts[1] + unbond_amounts[2] + unbond_amounts[3] + unbond_amounts[4];
    this.core_protocol_balance.set(BigInt("0"), new_total_protocol_balance);
    }
    
  rebalance_redistribute(
    rebond_amounts: bigint[],
    validators: string[],
  ) {
// ********** REDISTRIBUTE PROTOCOL POOL **********
// note -- in the case that a delegator is changing validators, the delegator
// may not have cleared its entire stake, so clear_residual_bonded_delegators must be called
    this.credits.caller = "core_protocol.aleo";
    this.credits.transfer_public(this.DELEGATOR_1, rebond_amounts[0]);
    this.delegator1.caller = "core_protocol.aleo";
    this.delegator1.bond(validators[0], rebond_amounts[0]);
    
    this.credits.caller = "core_protocol.aleo";
    this.credits.transfer_public(this.DELEGATOR_2, rebond_amounts[1]);
    this.delegator2.caller = "core_protocol.aleo";
    this.delegator2.bond(validators[1], rebond_amounts[1]);
    
    this.credits.caller = "core_protocol.aleo";
    this.credits.transfer_public(this.DELEGATOR_3, rebond_amounts[2]);
    this.delegator3.caller = "core_protocol.aleo";
    this.delegator3.bond(validators[2], rebond_amounts[2]);
    
    this.credits.caller = "core_protocol.aleo";
    this.credits.transfer_public(this.DELEGATOR_4, rebond_amounts[3]);
    this.delegator4.caller = "core_protocol.aleo";
    this.delegator4.bond(validators[3], rebond_amounts[3]);
    
    this.credits.caller = "core_protocol.aleo";
    this.credits.transfer_public(this.DELEGATOR_5, rebond_amounts[4]);
    this.delegator5.caller = "core_protocol.aleo";
    this.delegator5.bond(validators[4], rebond_amounts[4]);
    
    return this.finalize_rebalance_redistribute(rebond_amounts, validators);
    }
    
  finalize_rebalance_redistribute(
    rebond_amounts: bigint[],
    validators: string[],
  ) {
    let d1_state: state = this.delegator_state.get(this.DELEGATOR_1)!;
    let d2_state: state = this.delegator_state.get(this.DELEGATOR_2)!;
    let d3_state: state = this.delegator_state.get(this.DELEGATOR_3)!;
    let d4_state: state = this.delegator_state.get(this.DELEGATOR_4)!;
    let d5_state: state = this.delegator_state.get(this.DELEGATOR_5)!;
    
// ********** ASSERT INPUTS AND STATE **********
// make sure the boost pool has been cleared
    let boost_pool_total: bigint = this.boost_pool.get(this.CORE_PROTOCOL) || BigInt("0");
    assert(boost_pool_total === BigInt("0"));
    
    assert(validators[0] === d1_state.validator);
    assert(validators[1] === d2_state.validator);
    assert(validators[2] === d3_state.validator);
    assert(validators[3] === d4_state.validator);
    assert(validators[4] === d5_state.validator);
    
    let rebond_total: bigint = rebond_amounts[0] + rebond_amounts[1] + rebond_amounts[2] + rebond_amounts[3] + rebond_amounts[4];
    let protocol_balance: bigint = this.core_protocol_balance.get(BigInt("0")) || BigInt("0");
    assert(protocol_balance <= rebond_total);
    
// ********** ENSURE THAT THE REBALANCING AMOUNTS ARE CORRECT **********
    let d1_stake: bigint = d1_state.stake;
    let d2_stake: bigint = d2_state.stake;
    let d3_stake: bigint = d3_state.stake;
    let d4_stake: bigint = d4_state.stake;
    let d5_stake: bigint = d5_state.stake;
    
    let d1_balance: bigint = d1_stake + rebond_amounts[0];
    let d2_balance: bigint = d2_stake + rebond_amounts[1];
    let d3_balance: bigint = d3_stake + rebond_amounts[2];
    let d4_balance: bigint = d4_stake + rebond_amounts[3];
    let d5_balance: bigint = d5_stake + rebond_amounts[4];
    let total_balance: bigint = d1_balance + d2_balance + d3_balance + d4_balance + d5_balance;
    
    let d1_num: bigint = d1_balance * this.PRECISION_UNSIGNED;
    let d2_num: bigint = d2_balance * this.PRECISION_UNSIGNED;
    let d3_num: bigint = d3_balance * this.PRECISION_UNSIGNED;
    let d4_num: bigint = d4_balance * this.PRECISION_UNSIGNED;
    let d5_num: bigint = d5_balance * this.PRECISION_UNSIGNED;
    
    let d1_quotient: bigint = d1_num / total_balance;
    let d2_quotient: bigint = d2_num / total_balance;
    let d3_quotient: bigint = d3_num / total_balance;
    let d4_quotient: bigint = d4_num / total_balance;
    let d5_quotient: bigint = d5_num / total_balance;
    
// portion_delegator mapping was set in previous rebalancing part, make sure
// the calculated portion matches the ideal portion_delegator mapping
    assert(this.portion_delegator.get(d1_quotient)! === this.DELEGATOR_1);
    assert(this.portion_delegator.get(d2_quotient)! === this.DELEGATOR_2);
    assert(this.portion_delegator.get(d3_quotient)! === this.DELEGATOR_3);
    assert(this.portion_delegator.get(d4_quotient)! === this.DELEGATOR_4);
    assert(this.portion_delegator.get(d5_quotient)! === this.DELEGATOR_5);
    
// ********** UPDATE DELEGATOR STATES **********
    let new_d1_state: state = {
    stake: d1_state.stake + rebond_amounts[0],
    reward: BigInt("0"),
    performance: d1_state.performance,
    unbond_amount: BigInt("0"),
    validator: d1_state.validator,
    ideal_portion: d1_state.ideal_portion
    };
    let new_d2_state: state = {
    stake: d2_state.stake + rebond_amounts[1],
    reward: BigInt("0"),
    performance: d2_state.performance,
    unbond_amount: BigInt("0"),
    validator: d2_state.validator,
    ideal_portion: d2_state.ideal_portion
    };
    let new_d3_state: state = {
    stake: d3_state.stake + rebond_amounts[2],
    reward: BigInt("0"),
    performance: d3_state.performance,
    unbond_amount: BigInt("0"),
    validator: d3_state.validator,
    ideal_portion: d3_state.ideal_portion
    };
    let new_d4_state: state = {
    stake: d4_state.stake + rebond_amounts[3],
    reward: BigInt("0"),
    performance: d4_state.performance,
    unbond_amount: BigInt("0"),
    validator: d4_state.validator,
    ideal_portion: d4_state.ideal_portion
    };
    let new_d5_state: state = {
    stake: d5_state.stake + rebond_amounts[4],
    reward: BigInt("0"),
    performance: d5_state.performance,
    unbond_amount: BigInt("0"),
    validator: d5_state.validator,
    ideal_portion: d5_state.ideal_portion
    };
    
    this.delegator_state.set(this.DELEGATOR_1, new_d1_state);
    this.delegator_state.set(this.DELEGATOR_2, new_d2_state);
    this.delegator_state.set(this.DELEGATOR_3, new_d3_state);
    this.delegator_state.set(this.DELEGATOR_4, new_d4_state);
    this.delegator_state.set(this.DELEGATOR_5, new_d5_state);
    
// *********** CHECK & UPDATE PROTOCOL STATE **********
    assert(this.protocol_state.get(BigInt("0"))! === BigInt("4"));
// rebalancing finished, set protocol back to normal
    this.protocol_state.set(BigInt("0"), BigInt("0"));
    
// we should have drained all the protocol balance that we are aware of
    this.core_protocol_balance.set(BigInt("0"), BigInt("0"));
    
    this.last_rebalance_height.set(BigInt("0"), this.block.height);
    }
    
// in the event we are changing validators, unbonding once may not actually clear the full balance because of
// block reward timing. In that case, we need to clear the residual bonded amounts
  clear_residual_delegators(
    residual_amounts: bigint[],
  ) {
// no rewards minted for residue clearing, as this should be a rare event
    if (residual_amounts[0] > BigInt("0")) {
    this.oracle.caller = "core_protocol.aleo";
    this.oracle.clear_residual_delegator(this.DELEGATOR_1, residual_amounts[0]);
    this.delegator1.caller = "core_protocol.aleo";
    this.delegator1.unbond(residual_amounts[0]);
    }
    
    if (residual_amounts[1] > BigInt("0")) {
    this.oracle.caller = "core_protocol.aleo";
    this.oracle.clear_residual_delegator(this.DELEGATOR_2, residual_amounts[1]);
    this.delegator2.caller = "core_protocol.aleo";
    this.delegator2.unbond(residual_amounts[1]);
    }
    
    if (residual_amounts[2] > BigInt("0")) {
    this.oracle.caller = "core_protocol.aleo";
    this.oracle.clear_residual_delegator(this.DELEGATOR_3, residual_amounts[2]);
    this.delegator3.caller = "core_protocol.aleo";
    this.delegator3.unbond(residual_amounts[2]);
    }
    
    if (residual_amounts[3] > BigInt("0")) {
    this.oracle.caller = "core_protocol.aleo";
    this.oracle.clear_residual_delegator(this.DELEGATOR_4, residual_amounts[3]);
    this.delegator4.caller = "core_protocol.aleo";
    this.delegator4.unbond(residual_amounts[3]);
    }
    
    if (residual_amounts[4] > BigInt("0")) {
    this.oracle.caller = "core_protocol.aleo";
    this.oracle.clear_residual_delegator(this.DELEGATOR_5, residual_amounts[4]);
    this.delegator5.caller = "core_protocol.aleo";
    this.delegator5.unbond(residual_amounts[4]);
    }
    
    return this.finalize_clear_residual_delegators(residual_amounts);
    }
    
  finalize_clear_residual_delegators(
    residual_amounts: bigint[],
  ) {
// *********** ASSERT PROTOCOL STATE **********
// This should only occur when the protocol has begun unbonding
    let curr_protocol_state: bigint = this.protocol_state.get(BigInt("0"))!;
    let can_clear: boolean = curr_protocol_state == BigInt("2") || curr_protocol_state == BigInt("3");
    assert(can_clear);
    
// *********** UPDATE DELEGATOR STATES **********
    let d1_state: state = this.delegator_state.get(this.DELEGATOR_1)!;
    let d2_state: state = this.delegator_state.get(this.DELEGATOR_2)!;
    let d3_state: state = this.delegator_state.get(this.DELEGATOR_3)!;
    let d4_state: state = this.delegator_state.get(this.DELEGATOR_4)!;
    let d5_state: state = this.delegator_state.get(this.DELEGATOR_5)!;
    
    let new_d1_state: state = {
    stake: d1_state.stake,
    reward: d1_state.reward,
    performance: d1_state.performance,
    unbond_amount: d1_state.unbond_amount + residual_amounts[0],
    validator: d1_state.validator,
    ideal_portion: d1_state.ideal_portion
    };
    
    let new_d2_state: state = {
    stake: d2_state.stake,
    reward: d2_state.reward,
    performance: d2_state.performance,
    unbond_amount: d2_state.unbond_amount + residual_amounts[1],
    validator: d2_state.validator,
    ideal_portion: d2_state.ideal_portion
    };
    
    let new_d3_state: state = {
    stake: d3_state.stake,
    reward: d3_state.reward,
    performance: d3_state.performance,
    unbond_amount: d3_state.unbond_amount + residual_amounts[2],
    validator: d3_state.validator,
    ideal_portion: d3_state.ideal_portion
    };
    
    let new_d4_state: state = {
    stake: d4_state.stake,
    reward: d4_state.reward,
    performance: d4_state.performance,
    unbond_amount: d4_state.unbond_amount + residual_amounts[3],
    validator: d4_state.validator,
    ideal_portion: d4_state.ideal_portion
    };
    
    let new_d5_state: state = {
    stake: d5_state.stake,
    reward: d5_state.reward,
    performance: d5_state.performance,
    unbond_amount: d5_state.unbond_amount + residual_amounts[4],
    validator: d5_state.validator,
    ideal_portion: d5_state.ideal_portion
    };
    
    this.delegator_state.set(this.DELEGATOR_1, new_d1_state);
    this.delegator_state.set(this.DELEGATOR_2, new_d2_state);
    this.delegator_state.set(this.DELEGATOR_3, new_d3_state);
    this.delegator_state.set(this.DELEGATOR_4, new_d4_state);
    this.delegator_state.set(this.DELEGATOR_5, new_d5_state);
    }
    
  fix_orphaned_delegators(
    amounts: bigint[],
  ) {
    if (amounts[0] > BigInt("0")) {
    this.delegator1.caller = "core_protocol.aleo";
    this.delegator1.claim_unbond();
    this.delegator1.caller = "core_protocol.aleo";
    this.delegator1.transfer_to_core_protocol(amounts[0]);
    this.oracle.caller = "core_protocol.aleo";
    this.oracle.confirm_orphaned_delegator(this.DELEGATOR_1, amounts[0]);
    }
    
    if (amounts[1] > BigInt("0")) {
    this.delegator2.caller = "core_protocol.aleo";
    this.delegator2.claim_unbond();
    this.delegator2.caller = "core_protocol.aleo";
    this.delegator2.transfer_to_core_protocol(amounts[1]);
    this.oracle.caller = "core_protocol.aleo";
    this.oracle.confirm_orphaned_delegator(this.DELEGATOR_2, amounts[1]);
    }
    
    if (amounts[2] > BigInt("0")) {
    this.delegator3.caller = "core_protocol.aleo";
    this.delegator3.claim_unbond();
    this.delegator3.caller = "core_protocol.aleo";
    this.delegator3.transfer_to_core_protocol(amounts[2]);
    this.oracle.caller = "core_protocol.aleo";
    this.oracle.confirm_orphaned_delegator(this.DELEGATOR_3, amounts[2]);
    }
    
    if (amounts[3] > BigInt("0")) {
    this.delegator4.caller = "core_protocol.aleo";
    this.delegator4.claim_unbond();
    this.delegator4.caller = "core_protocol.aleo";
    this.delegator4.transfer_to_core_protocol(amounts[3]);
    this.oracle.caller = "core_protocol.aleo";
    this.oracle.confirm_orphaned_delegator(this.DELEGATOR_4, amounts[3]);
    }
    
    if (amounts[4] > BigInt("0")) {
    this.delegator5.caller = "core_protocol.aleo";
    this.delegator5.claim_unbond();
    this.delegator5.caller = "core_protocol.aleo";
    this.delegator5.transfer_to_core_protocol(amounts[4]);
    this.oracle.caller = "core_protocol.aleo";
    this.oracle.confirm_orphaned_delegator(this.DELEGATOR_5, amounts[4]);
    }
    
    return this.finalize_fix_orphaned_delegators(amounts);
    }
    
  finalize_fix_orphaned_delegators(
    amounts: bigint[],
  ) {
// *********** UPDATE PROTOCOL STATE **********
    let d1_state: state = this.delegator_state.get(this.DELEGATOR_1)!;
    let d2_state: state = this.delegator_state.get(this.DELEGATOR_2)!;
    let d3_state: state = this.delegator_state.get(this.DELEGATOR_3)!;
    let d4_state: state = this.delegator_state.get(this.DELEGATOR_4)!;
    let d5_state: state = this.delegator_state.get(this.DELEGATOR_5)!;
    
    let new_d1_state: state = {
    stake: d1_state.stake - amounts[0],
    reward: BigInt("0"),
    performance: d1_state.performance,
    unbond_amount: BigInt("0"),
    validator: d1_state.validator,
    ideal_portion: d1_state.ideal_portion
    };
    let new_d2_state: state = {
    stake: d2_state.stake - amounts[1],
    reward: BigInt("0"),
    performance: d2_state.performance,
    unbond_amount: BigInt("0"),
    validator: d2_state.validator,
    ideal_portion: d2_state.ideal_portion
    };
    let new_d3_state: state = {
    stake: d3_state.stake - amounts[2],
    reward: BigInt("0"),
    performance: d3_state.performance,
    unbond_amount: BigInt("0"),
    validator: d3_state.validator,
    ideal_portion: d3_state.ideal_portion
    };
    let new_d4_state: state = {
    stake: d4_state.stake - amounts[3],
    reward: BigInt("0"),
    performance: d4_state.performance,
    unbond_amount: BigInt("0"),
    validator: d4_state.validator,
    ideal_portion: d4_state.ideal_portion
    };
    let new_d5_state: state = {
    stake: d5_state.stake - amounts[4],
    reward: BigInt("0"),
    performance: d5_state.performance,
    unbond_amount: BigInt("0"),
    validator: d5_state.validator,
    ideal_portion: d5_state.ideal_portion
    };
    
    this.delegator_state.set(this.DELEGATOR_1, new_d1_state);
    this.delegator_state.set(this.DELEGATOR_2, new_d2_state);
    this.delegator_state.set(this.DELEGATOR_3, new_d3_state);
    this.delegator_state.set(this.DELEGATOR_4, new_d4_state);
    this.delegator_state.set(this.DELEGATOR_5, new_d5_state);
    
// *********** CHECK & UPDATE PROTOCOL STATE **********
    let protocol_balance: bigint = this.core_protocol_balance.get(BigInt("0")) || BigInt("0");
    let protocol_balance_with_unbond: bigint = protocol_balance + amounts[0] + amounts[1] + amounts[2] + amounts[3] + amounts[4];
    this.core_protocol_balance.set(BigInt("0"), protocol_balance_with_unbond);
    }
    
    
  create_withdraw_claim(
    ale_record: token,
    current_height: bigint,
    total_ale_minted: bigint,
    total_ale_burned: bigint,
    ale_burn_amount: bigint,
    credits_claim_amount: bigint,
  ) {
    this.ale.caller = "core_protocol.aleo";
    this.ale.assert_totals(total_ale_minted, total_ale_burned);
    let total_ale_pool: bigint = total_ale_minted - total_ale_burned;
    
    let fee_calc: bigint = ale_burn_amount * this.WITHDRAW_FEE / this.PRECISION_UNSIGNED;
    let fee: bigint = fee_calc;
    let min_block_height: bigint = current_height + this.WITHDRAW_WAIT_MINIMUM;
    let min_block_rounded_down: bigint = min_block_height / BigInt("10000") * BigInt("10000");
    let min_block_round_up: bigint = min_block_rounded_down + BigInt("10000");
// burn full amount of ale, but immediately mint the fee to the protocol. Only withdraw credits_to_claim as the difference
    this.ale.caller = "core_protocol.aleo";
    this.ale.burn_private(ale_record, ale_burn_amount, credits_claim_amount, min_block_round_up);
    this.ale.caller = "core_protocol.aleo";
    this.ale.mint_public(fee, this.AXEL);
    let net_ale_burn_amount: bigint = ale_burn_amount - fee;
    return this.finalize_create_withdraw_claim(
    current_height,
    net_ale_burn_amount,
    min_block_round_up,
    credits_claim_amount,
    total_ale_pool);
    }
    
  finalize_create_withdraw_claim(
    current_height: bigint,
    net_ale_burn_amount: bigint,
    withdraw_block: bigint,
    credits_withdraw: bigint,
    total_ale_pool: bigint,
  ) {
    assert(this.block.height >= current_height);
    let total_withdraw_amount: bigint = this.withdraw_pool.get(withdraw_block) || BigInt("0");
    total_withdraw_amount = total_withdraw_amount + credits_withdraw;
    this.withdraw_pool.set(withdraw_block, total_withdraw_amount);
    
    let protocol_pending_withdraw_balance: bigint = this.core_protocol_balance.get(BigInt("1")) || BigInt("0");
    let new_protocol_pending_withdraw_balance: bigint = protocol_pending_withdraw_balance + credits_withdraw;
    this.core_protocol_balance.set(BigInt("1"), new_protocol_pending_withdraw_balance);
    
    let d1_state: state = this.delegator_state.get(this.DELEGATOR_1)!;
    let d2_state: state = this.delegator_state.get(this.DELEGATOR_2)!;
    let d3_state: state = this.delegator_state.get(this.DELEGATOR_3)!;
    let d4_state: state = this.delegator_state.get(this.DELEGATOR_4)!;
    let d5_state: state = this.delegator_state.get(this.DELEGATOR_5)!;
    
// ********** CONFIRM RATIO OF ALEO AND ALE POOLS **********
    let pool_balance: bigint = this.core_protocol_balance.get(BigInt("0")) || BigInt("0");
    let total_aleo_before: bigint = pool_balance + d1_state.stake + d2_state.stake + d3_state.stake + d4_state.stake + d5_state.stake - protocol_pending_withdraw_balance;
    let total_aleo_after: bigint = total_aleo_before - credits_withdraw;
    
    let total_ale_before: bigint = total_ale_pool;
    let total_ale_after: bigint = total_ale_before - net_ale_burn_amount;
    
// aleo_before / aleo_after should equal ale_before / ale_after
// aleo_before * ale_after = aleo_after * ale_before
    
    let product_1: bigint = total_aleo_before * total_ale_after;
    let product_2: bigint = total_aleo_after * total_ale_before;
    assert(product_1 === product_2);
    }
    
  withdraw_unbond(
    unbond_amounts: bigint[],
    total_amount: bigint,
    withdraw_block: bigint,
  ) {
    assert(total_amount === unbond_amounts[0] + unbond_amounts[1] + unbond_amounts[2] + unbond_amounts[3] + unbond_amounts[4]);
    this.delegator1.caller = "core_protocol.aleo";
    this.delegator1.unbond(unbond_amounts[0]);
    this.delegator2.caller = "core_protocol.aleo";
    this.delegator2.unbond(unbond_amounts[1]);
    this.delegator3.caller = "core_protocol.aleo";
    this.delegator3.unbond(unbond_amounts[2]);
    this.delegator4.caller = "core_protocol.aleo";
    this.delegator4.unbond(unbond_amounts[3]);
    this.delegator5.caller = "core_protocol.aleo";
    this.delegator5.unbond(unbond_amounts[4]);
    
    return this.finalize_withdraw_unbond(unbond_amounts, total_amount, withdraw_block);
    }
    
  finalize_withdraw_unbond(
    unbond_amounts: bigint[],
    total_amount: bigint,
    withdraw_block: bigint,
  ) {
    let d1_state: state = this.delegator_state.get(this.DELEGATOR_1)!;
    let d2_state: state = this.delegator_state.get(this.DELEGATOR_2)!;
    let d3_state: state = this.delegator_state.get(this.DELEGATOR_3)!;
    let d4_state: state = this.delegator_state.get(this.DELEGATOR_4)!;
    let d5_state: state = this.delegator_state.get(this.DELEGATOR_5)!;
    let saved_withdraw_amount: bigint = this.withdraw_pool.get(withdraw_block) || BigInt("0");
    
// ********** ASSERT INPUTS AND STATE **********
    assert(saved_withdraw_amount === total_amount);
    
// ********** ASSERT THAT DELEGATOR PROPORTIONS DO NOT CHANGE **********
    let curr_total_stake: bigint = d1_state.stake + d2_state.stake + d3_state.stake + d4_state.stake + d5_state.stake;
    let curr_d1_ratio: bigint = d1_state.stake * this.PRECISION / curr_total_stake;
    let curr_d2_ratio: bigint = d2_state.stake * this.PRECISION / curr_total_stake;
    let curr_d3_ratio: bigint = d3_state.stake * this.PRECISION / curr_total_stake;
    let curr_d4_ratio: bigint = d4_state.stake * this.PRECISION / curr_total_stake;
    let curr_d5_ratio: bigint = d5_state.stake * this.PRECISION / curr_total_stake;
    
    let new_total_stake: bigint = curr_total_stake - total_amount;
    let new_d1_stake: bigint = d1_state.stake - unbond_amounts[0];
    let new_d2_stake: bigint = d2_state.stake - unbond_amounts[1];
    let new_d3_stake: bigint = d3_state.stake - unbond_amounts[2];
    let new_d4_stake: bigint = d4_state.stake - unbond_amounts[3];
    let new_d5_stake: bigint = d5_state.stake - unbond_amounts[4];
    
    let new_d1_ratio: bigint = new_d1_stake  * this.PRECISION / new_total_stake;
    let new_d2_ratio: bigint = new_d2_stake  * this.PRECISION / new_total_stake;
    let new_d3_ratio: bigint = new_d3_stake  * this.PRECISION / new_total_stake;
    let new_d4_ratio: bigint = new_d4_stake  * this.PRECISION / new_total_stake;
    let new_d5_ratio: bigint = new_d5_stake  * this.PRECISION / new_total_stake;
    
    assert(curr_d1_ratio === new_d1_ratio);
    assert(curr_d2_ratio === new_d2_ratio);
    assert(curr_d3_ratio === new_d3_ratio);
    assert(curr_d4_ratio === new_d4_ratio);
    assert(curr_d5_ratio === new_d5_ratio);
    
// ********** UPDATE DELEGATOR STATES **********
    let new_d1_state: state = {
    stake: new_d1_stake,
    reward: d1_state.reward,
    performance: d1_state.performance,
    unbond_amount: unbond_amounts[0],
    validator: d1_state.validator,
    ideal_portion: d1_state.ideal_portion
    };
    
    let new_d2_state: state = {
    stake: new_d2_stake,
    reward: d2_state.reward,
    performance: d2_state.performance,
    unbond_amount: unbond_amounts[1],
    validator: d2_state.validator,
    ideal_portion: d2_state.ideal_portion
    };
    
    let new_d3_state: state = {
    stake: new_d3_stake,
    reward: d3_state.reward,
    performance: d3_state.performance,
    unbond_amount: unbond_amounts[2],
    validator: d3_state.validator,
    ideal_portion: d3_state.ideal_portion
    };
    
    let new_d4_state: state = {
    stake: new_d4_stake,
    reward: d4_state.reward,
    performance: d4_state.performance,
    unbond_amount: unbond_amounts[3],
    validator: d4_state.validator,
    ideal_portion: d4_state.ideal_portion
    };
    
    let new_d5_state: state = {
    stake: new_d5_stake,
    reward: d5_state.reward,
    performance: d5_state.performance,
    unbond_amount: unbond_amounts[4],
    validator: d5_state.validator,
    ideal_portion: d5_state.ideal_portion
    };
    
    this.delegator_state.set(this.DELEGATOR_1, new_d1_state);
    this.delegator_state.set(this.DELEGATOR_2, new_d2_state);
    this.delegator_state.set(this.DELEGATOR_3, new_d3_state);
    this.delegator_state.set(this.DELEGATOR_4, new_d4_state);
    this.delegator_state.set(this.DELEGATOR_5, new_d5_state);
    
// *********** UPDATE PROTOCOL STATE **********
    assert(this.protocol_state.get(BigInt("0"))! === BigInt("0"));
    this.protocol_state.set(BigInt("0"), BigInt("10"));
    
    let withdraw_pool_total: bigint = this.core_protocol_balance.get(BigInt("1")) || BigInt("0");
    let new_withdraw_pool_total: bigint = withdraw_pool_total - total_amount;
    this.core_protocol_balance.set(BigInt("1"), new_withdraw_pool_total);
    }
    
  withdraw_claim_unbond(
    unbond_amounts: bigint[],
  ) {
// ********** CLAIM UNBOND AND SEND TO ALEO POOL OWNED BY ALE **********
// note -- in the case that a validator has forcibly unbonded a delegator,
// the fix_orphaned_delegator transition must be called
    this.delegator1.caller = "core_protocol.aleo";
    this.delegator1.claim_unbond();
    this.delegator1.caller = "core_protocol.aleo";
    this.delegator1.transfer_to_ale(unbond_amounts[0]);
    
    this.delegator2.caller = "core_protocol.aleo";
    this.delegator2.claim_unbond();
    this.delegator2.caller = "core_protocol.aleo";
    this.delegator2.transfer_to_ale(unbond_amounts[1]);
    
    this.delegator3.caller = "core_protocol.aleo";
    this.delegator3.claim_unbond();
    this.delegator3.caller = "core_protocol.aleo";
    this.delegator3.transfer_to_ale(unbond_amounts[2]);
    
    this.delegator4.caller = "core_protocol.aleo";
    this.delegator4.claim_unbond();
    this.delegator4.caller = "core_protocol.aleo";
    this.delegator4.transfer_to_ale(unbond_amounts[3]);
    
    this.delegator5.caller = "core_protocol.aleo";
    this.delegator5.claim_unbond();
    this.delegator5.caller = "core_protocol.aleo";
    this.delegator5.transfer_to_ale(unbond_amounts[4]);
    
    return this.finalize_withdraw_claim_unbond(unbond_amounts);
    }
    
  finalize_withdraw_claim_unbond(
    unbond_amounts: bigint[],
  ) {
    let d1_state: state = this.delegator_state.get(this.DELEGATOR_1)!;
    let d2_state: state = this.delegator_state.get(this.DELEGATOR_2)!;
    let d3_state: state = this.delegator_state.get(this.DELEGATOR_3)!;
    let d4_state: state = this.delegator_state.get(this.DELEGATOR_4)!;
    let d5_state: state = this.delegator_state.get(this.DELEGATOR_5)!;
    
// ********** ASSERT INPUTS AND STATE **********
    assert(unbond_amounts[0] === d1_state.unbond_amount);
    assert(unbond_amounts[1] === d2_state.unbond_amount);
    assert(unbond_amounts[2] === d3_state.unbond_amount);
    assert(unbond_amounts[3] === d4_state.unbond_amount);
    assert(unbond_amounts[4] === d5_state.unbond_amount);
    
// ********** UPDATE DELEGATOR STATES **********
    let new_d1_state: state = {
    stake: d1_state.stake,
    reward: d1_state.reward,
    performance: d1_state.performance,
    unbond_amount: BigInt("0"),
    validator: d1_state.validator,
    ideal_portion: d1_state.ideal_portion
    };
    
    let new_d2_state: state = {
    stake: d2_state.stake,
    reward: d2_state.reward,
    performance: d2_state.performance,
    unbond_amount: BigInt("0"),
    validator: d2_state.validator,
    ideal_portion: d2_state.ideal_portion
    };
    
    let new_d3_state: state = {
    stake: d3_state.stake,
    reward: d3_state.reward,
    performance: d3_state.performance,
    unbond_amount: BigInt("0"),
    validator: d3_state.validator,
    ideal_portion: d3_state.ideal_portion
    };
    
    let new_d4_state: state = {
    stake: d4_state.stake,
    reward: d4_state.reward,
    performance: d4_state.performance,
    unbond_amount: BigInt("0"),
    validator: d4_state.validator,
    ideal_portion: d4_state.ideal_portion
    };
    
    let new_d5_state: state = {
    stake: d5_state.stake,
    reward: d5_state.reward,
    performance: d5_state.performance,
    unbond_amount: BigInt("0"),
    validator: d5_state.validator,
    ideal_portion: d5_state.ideal_portion
    };
    
    this.delegator_state.set(this.DELEGATOR_1, new_d1_state);
    this.delegator_state.set(this.DELEGATOR_2, new_d2_state);
    this.delegator_state.set(this.DELEGATOR_3, new_d3_state);
    this.delegator_state.set(this.DELEGATOR_4, new_d4_state);
    this.delegator_state.set(this.DELEGATOR_5, new_d5_state);
    
// *********** CHECK & UPDATE PROTOCOL STATE **********
    assert(this.protocol_state.get(BigInt("0"))! === BigInt("10"));
// withdraw claim finished, set protocol back to normal
    this.protocol_state.set(BigInt("0"), BigInt("0"));
    }
    
  deposit_private(
    input_record: credits,
    credits_deposit: bigint,
    referrer: string,
    total_ale_minted: bigint,
    total_ale_burned: bigint,
    ale_to_mint: bigint,
    average_block_reward: bigint,
  ) {
// transfer aleo to pool
    this.ale.caller = "core_protocol.aleo";
    this.ale.assert_totals(total_ale_minted, total_ale_burned);
    this.oracle.caller = "core_protocol.aleo";
    this.oracle.confirm_average_block_reward(average_block_reward);
    let total_ale_pool: bigint = total_ale_minted - total_ale_burned;
    this.credits.caller = "core_protocol.aleo";
    let updated_record: credits = this.credits.transfer_private_to_public(input_record, this.CORE_PROTOCOL, credits_deposit);
    this.ale.caller = "core_protocol.aleo";
    this.ale.mint_private(ale_to_mint, this.caller);
    this.finalize_deposit_private(
    credits_deposit,
    total_ale_pool,
    ale_to_mint,
    average_block_reward);
    return [updated_record];  
}
    
  finalize_deposit_private(
    credits_deposit: bigint,
    total_ale_pool: bigint,
    expected_ale_mint: bigint,
    average_block_reward: bigint,
  ) {
    let d1_state: state = this.delegator_state.get(this.DELEGATOR_1)!;
    let d2_state: state = this.delegator_state.get(this.DELEGATOR_2)!;
    let d3_state: state = this.delegator_state.get(this.DELEGATOR_3)!;
    let d4_state: state = this.delegator_state.get(this.DELEGATOR_4)!;
    let d5_state: state = this.delegator_state.get(this.DELEGATOR_5)!;
    
    let pending_withdraw_balance: bigint = this.core_protocol_balance.get(BigInt("1")) || BigInt("0");
    
// ********** CONFIRM RATIO OF ALEO AND ALE POOLS **********
    let pool_balance: bigint = this.core_protocol_balance.get(BigInt("0")) || BigInt("0");
    let total_aleo: bigint = pool_balance - pending_withdraw_balance + d1_state.stake + d2_state.stake + d3_state.stake + d4_state.stake + d5_state.stake;
    let last_rebalance: bigint = this.last_rebalance_height.get(BigInt("0"))!;
    total_aleo += this.inline_rewards_earned_at_height(this.block.height, last_rebalance, average_block_reward);
    
// Confirm ale mint amoount
    let delta_aleo: bigint = credits_deposit;
    let aleo_pool: bigint = total_aleo;
    let ale_mint_amount: bigint = this.inline_get_ale_mint_amount(aleo_pool, delta_aleo, total_ale_pool);
    assert(ale_mint_amount === expected_ale_mint);
    assert(ale_mint_amount >= BigInt("1"));
    
// Update deposit pool
    pool_balance += credits_deposit;
    this.core_protocol_balance.set(BigInt("0"), pool_balance);
    }
    
  inline_rewards_earned_at_height(
    height: bigint,
    last_rebalance: bigint,
    average_block_reward: bigint,
  ) {
    let blocks_since_rebalance: bigint = height - last_rebalance;
    let rewards_earned: bigint = blocks_since_rebalance * average_block_reward;
    return rewards_earned;
    }
    
  inline_get_ale_mint_amount(
    p_aleo: bigint,
    delta_aleo: bigint,
    p_ale: bigint,
  ) {
    let pool_ratio: bigint = ((p_ale * this.PRECISION_UNSIGNED) / p_aleo);
    let new_ale: bigint = (p_aleo + delta_aleo) * pool_ratio;
    let diff: bigint = (new_ale / this.PRECISION_UNSIGNED) - p_ale;
    let delta_ale: bigint = diff;
    return delta_ale;
    }
    
  bond_deposit_pool(
    validators: string[],
    transfer_amounts: bigint[],
  ) {
// Transfer to each validator
    this.credits.caller = "core_protocol.aleo";
    this.credits.transfer_public(this.DELEGATOR_1, transfer_amounts[0]);
    this.delegator1.caller = "core_protocol.aleo";
    this.delegator1.bond(validators[0], transfer_amounts[0]);
    
    this.credits.caller = "core_protocol.aleo";
    this.credits.transfer_public(this.DELEGATOR_2, transfer_amounts[1]);
    this.delegator2.caller = "core_protocol.aleo";
    this.delegator2.bond(validators[1], transfer_amounts[1]);
    
    this.credits.caller = "core_protocol.aleo";
    this.credits.transfer_public(this.DELEGATOR_3, transfer_amounts[2]);
    this.delegator3.caller = "core_protocol.aleo";
    this.delegator3.bond(validators[2], transfer_amounts[2]);
    
    this.credits.caller = "core_protocol.aleo";
    this.credits.transfer_public(this.DELEGATOR_4, transfer_amounts[3]);
    this.delegator4.caller = "core_protocol.aleo";
    this.delegator4.bond(validators[3], transfer_amounts[3]);
    
    this.credits.caller = "core_protocol.aleo";
    this.credits.transfer_public(this.DELEGATOR_5, transfer_amounts[4]);
    this.delegator5.caller = "core_protocol.aleo";
    this.delegator5.bond(validators[4], transfer_amounts[4]);
    
    return this.finalize_bond_deposit_pool(validators, transfer_amounts);
    }
    
  finalize_bond_deposit_pool(
    validators: string[],
    transfer_amounts: bigint[],
  ) {
// ********** ASSERT INPUTS AND STATE **********
// Confirm bonding is allowed
    let curr_protocol_state: bigint = this.protocol_state.get(BigInt("0"))!;
    let bonding_allowed: boolean = curr_protocol_state == BigInt("0") || curr_protocol_state == BigInt("3");
    assert(bonding_allowed);
    
// Confirm we have the minimum amount
    let pool_balance: bigint = this.core_protocol_balance.get(BigInt("0")) || BigInt("0");
    assert(pool_balance >= this.MINIMUM_BOND_POOL);
    
// Confirm transfer amounts are correct, update balances
    let total_transfer: bigint = transfer_amounts[0] + transfer_amounts[1] + transfer_amounts[2] + transfer_amounts[3] + transfer_amounts[4];
    let d1_state: state = this.delegator_state.get(this.DELEGATOR_1)!;
    let d2_state: state = this.delegator_state.get(this.DELEGATOR_2)!;
    let d3_state: state = this.delegator_state.get(this.DELEGATOR_3)!;
    let d4_state: state = this.delegator_state.get(this.DELEGATOR_4)!;
    let d5_state: state = this.delegator_state.get(this.DELEGATOR_5)!;
    
    let d1_transfer: bigint = d1_state.ideal_portion * total_transfer / this.PRECISION_UNSIGNED;
    let d2_transfer: bigint = d2_state.ideal_portion * total_transfer / this.PRECISION_UNSIGNED;
    let d3_transfer: bigint = d3_state.ideal_portion * total_transfer / this.PRECISION_UNSIGNED;
    let d4_transfer: bigint = d4_state.ideal_portion * total_transfer / this.PRECISION_UNSIGNED;
    let d5_transfer: bigint = d5_state.ideal_portion * total_transfer / this.PRECISION_UNSIGNED;
    
    assert(transfer_amounts[0] === d1_transfer);
    assert(transfer_amounts[1] === d2_transfer);
    assert(transfer_amounts[2] === d3_transfer);
    assert(transfer_amounts[3] === d4_transfer);
    assert(transfer_amounts[4] === d5_transfer);
    
    assert(validators[0] === d1_state.validator);
    assert(validators[1] === d2_state.validator);
    assert(validators[2] === d3_state.validator);
    assert(validators[3] === d4_state.validator);
    assert(validators[4] === d5_state.validator);
    
// Set new delegator state
    let new_d1_state: state = {
    stake: d1_state.stake + transfer_amounts[0],
    reward: d1_state.reward,
    performance: d1_state.performance,
    unbond_amount: d1_state.unbond_amount,
    validator: d1_state.validator,
    ideal_portion: d1_state.ideal_portion
    };
    let new_d2_state: state = {
    stake: d2_state.stake + transfer_amounts[1],
    reward: d2_state.reward,
    performance: d2_state.performance,
    unbond_amount: d2_state.unbond_amount,
    validator: d2_state.validator,
    ideal_portion: d2_state.ideal_portion
    };
    let new_d3_state: state = {
    stake: d3_state.stake + transfer_amounts[2],
    reward: d3_state.reward,
    performance: d3_state.performance,
    unbond_amount: d3_state.unbond_amount,
    validator: d3_state.validator,
    ideal_portion: d3_state.ideal_portion
    };
    let new_d4_state: state = {
    stake: d4_state.stake + transfer_amounts[3],
    reward: d4_state.reward,
    performance: d4_state.performance,
    unbond_amount: d4_state.unbond_amount,
    validator: d4_state.validator,
    ideal_portion: d4_state.ideal_portion
    };
    let new_d5_state: state = {
    stake: d5_state.stake + transfer_amounts[4],
    reward: d5_state.reward,
    performance: d5_state.performance,
    unbond_amount: d5_state.unbond_amount,
    validator: d5_state.validator,
    ideal_portion: d5_state.ideal_portion
    };
    
    this.delegator_state.set(this.DELEGATOR_1, new_d1_state);
    this.delegator_state.set(this.DELEGATOR_2, new_d2_state);
    this.delegator_state.set(this.DELEGATOR_3, new_d3_state);
    this.delegator_state.set(this.DELEGATOR_4, new_d4_state);
    this.delegator_state.set(this.DELEGATOR_5, new_d5_state);
    
// Subtract transfer amounts from pool
    pool_balance -= total_transfer;
    this.core_protocol_balance.set(BigInt("0"), pool_balance);
    }
    }
