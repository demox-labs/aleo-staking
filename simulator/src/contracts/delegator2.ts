import { token } from './ale';
import { credits } from './credits';
import { creditsProgram } from './credits';

import assert from 'assert';
// interfaces
export class delegator2Program {
  caller: string = "not set";
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  // params
  validator_address: Map<bigint, string> = new Map();
  unbond_available: Map<bigint, bigint> = new Map();
  ALE = "aleo1zpy3xyaf40uqt6v42wm8f9kzp7rhzrjy34kv5yyx3va4r9hgcsxstggn0q";
  CORE_PROTOCOL = "aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0";
  credits: creditsProgram;
  constructor(
    // constructor args
    creditsContract: creditsProgram,
  ) {
    // constructor body
    this.credits = creditsContract;
  }
  // The 'delegator' program.
// should be deployed with paramaters like the validator address
// this delegator should be bonded to
    
  //program delegator2.aleo {// 0u8 -> 0u8 = unbonding unavailable, 1u8 = unbonding available
// 0u8 -> address = validator address
    
  set_validator(
    validator: string,
  ) {
// assert_eq(self.caller, CORE_PROTOCOL);
    return this.finalize_set_validator(validator);
    }
    
  finalize_set_validator(
    validator: string,
  ) {
    this.validator_address.set(BigInt("0"), validator);
    }
    
  transfer_to_core_protocol(
    amount: bigint,
  ) {
    assert(this.caller === this.CORE_PROTOCOL);
    this.credits.caller = "delegator2.aleo";
    this.credits.transfer_public(this.CORE_PROTOCOL, amount);
    }
    
  transfer_to_ale(
    amount: bigint,
  ) {
    assert(this.caller === this.CORE_PROTOCOL);
    this.credits.caller = "delegator2.aleo";
    this.credits.transfer_public(this.ALE, amount);
    }
    
// this delegator program must have had credits sent to it or it will fail.
// must be at least 1 full credit, and the total bonded amount of the delegator must be at least 10 full credits
// the validator this delegator is bonded to must have at least 1 million credits.
  bond(
    validator: string,
    amount: bigint,
  ) {
    assert(this.caller === this.CORE_PROTOCOL);
    this.credits.caller = "delegator2.aleo";
    this.credits.bond_public(validator, amount);
    
    return this.finalize_bond(validator);
    }
    
  finalize_bond(
    validator: string,
  ) {
    let bound_validator: string = this.validator_address.get(BigInt("0"))!;
    assert(validator === bound_validator);
    }
    
// if the remaining balance would fall to below 10 full credits,
// then the entire remaining balance is unstaked.
  unbond(
    amount: bigint,
  ) {
    assert(this.caller === this.CORE_PROTOCOL);
    this.credits.caller = "delegator2.aleo";
    this.credits.unbond_public(amount);
    
    return this.finalize_unbond(amount);
    }
    
  finalize_unbond(
    amount: bigint,
  ) {
    assert(this.unbond_available.get(BigInt("0"))! === BigInt("1"));
// unbonding no longer available
    this.unbond_available.set(BigInt("0"), BigInt("0"));
    }
    
  claim_unbond(
  ) {
    assert(this.caller === this.CORE_PROTOCOL);
    this.credits.caller = "delegator2.aleo";
    this.credits.claim_unbond_public();
    
    return this.finalize_claim_unbond();
    }
    
  finalize_claim_unbond(
  ) {
// unbonding available again
    this.unbond_available.set(BigInt("0"), BigInt("1"));
    }
    }
