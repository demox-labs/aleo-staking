import { credits } from './credits';
import { creditsProgram } from './credits';

import assert from 'assert';
// interfaces
export interface approval {
  approver: string;
  spender: string;
}
export interface claim {
  owner: string;
  amount: bigint;
  min_claim_height: bigint;
}
export interface token {
  owner: string;
  amount: bigint;
}
export class aleProgram {
  caller: string = "not set";
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  // params
  approvals: Map<string, bigint> = new Map();
  totals: Map<bigint, bigint> = new Map();
  account: Map<string, bigint> = new Map();
  CORE_PROTOCOL = "aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0";
  credits: creditsProgram;
  constructor(
    // constructor args
    creditsContract: creditsProgram,
  ) {
    // constructor body
    this.credits = creditsContract;
  }
  // TODO: replace with ARC-20 standard, plus burn/mint
    
  //program ale.aleo {    
// 0u8 -- total minted
// 1u8 -- total burned
    
    
    
    
    
  approve_public(
    spender: string,
    amount: bigint,
  ) {
    let approve: approval = {
    approver: this.caller,
    spender: spender
    };
    let approval_hash: string = approve.toString();
    
    return this.finalize_approve_public(approval_hash, amount);
    }
    
  finalize_approve_public(
    approval_hash: string,
    amount: bigint,
  ) {
    let approvals_value: bigint = this.approvals.get(approval_hash) || BigInt("0");
    let new_approvals_value: bigint = approvals_value + amount;
    this.approvals.set(approval_hash, new_approvals_value);
    }
    
  unapprove_public(
    spender: string,
    amount: bigint,
  ) {
    let approve: approval = {
    approver: this.caller,
    spender: spender
    };
    let approval_hash: string = approve.toString();
    
    return this.finalize_unapprove_public(approval_hash, amount);
    }
    
  finalize_unapprove_public(
    approval_hash: string,
    amount: bigint,
  ) {
    let approvals_value: bigint = this.approvals.get(approval_hash) || BigInt("0");
    let new_approvals_value: bigint = approvals_value - amount;
    
    this.approvals.set(approval_hash, new_approvals_value);
    }
    
  transfer_from_public(
    approver: string,
    receiver: string,
    amount: bigint,
  ) {
    let approve: approval = {
    approver: approver,
    spender: this.caller
    };
    
    let approval_hash: string = approve.toString();
    
    return this.finalize_transfer_from_public(approval_hash, approver, receiver, amount);
    }
    
  finalize_transfer_from_public(
    approval_hash: string,
    approver: string,
    receiver: string,
    amount: bigint,
  ) {
    let approvals_value: bigint = this.approvals.get(approval_hash)!;
    let new_approvals_value: bigint = approvals_value - amount;
    this.approvals.set(approval_hash, new_approvals_value);
    
    let approver_balance: bigint = this.account.get(approver)!;
    let new_approver_balance: bigint = approver_balance - amount;
    this.account.set(approver, new_approver_balance);
    
    let receiver_balance: bigint = this.account.get(receiver) || BigInt("0");
    let new_receiver_balance: bigint = receiver_balance + amount;
    this.account.set(receiver, new_receiver_balance);
    }
    
  transfer_public(
    receiver: string,
    amount: bigint,
  ) {
    return this.finalize_transfer_public(this.caller, receiver, amount);
    }
    
  finalize_transfer_public(
    sender: string,
    receiver: string,
    amount: bigint,
  ) {
    let sender_balance: bigint = this.account.get(sender) || BigInt("0");
    let new_sender_balance: bigint = sender_balance - amount;
    this.account.set(sender, new_sender_balance);
    
    let receiver_balance: bigint = this.account.get(receiver) || BigInt("0");
    let new_receiver_balance: bigint = receiver_balance + amount;
    this.account.set(receiver, new_receiver_balance);
    }
    
    
  transfer_private(
    input_record: token,
    receiver: string,
    amount: bigint,
  ) {
    let new_input_record: token = {
    owner: input_record.owner,
    amount: input_record.amount - amount
    };
    
    let receiver_record: token = {
    owner: receiver,
    amount: amount
    };
    
    return [new_input_record, receiver_record];
    }
    
    
  transfer_private_to_public(
    input_record: token,
    receiver: string,
    amount: bigint,
  ) {
    let output_record: token = {
    owner: input_record.owner,
    amount: input_record.amount - amount
    };
    
    this.finalize_transfer_private_to_public(receiver, amount);
    return output_record;  
}
    
  finalize_transfer_private_to_public(
    receiver: string,
    amount: bigint,
  ) {
    let receiver_balance: bigint = this.account.get(receiver) || BigInt("0");
    let new_receiver_balance: bigint = receiver_balance + amount;
    this.account.set(receiver, new_receiver_balance);
    }
    
    
  transfer_public_to_private(
    receiver: string,
    amount: bigint,
  ) {
    let output_record: token = {
    owner: receiver,
    amount: amount
    };
    
    this.finalize_transfer_public_to_private(this.caller, amount);
    return output_record;  
}
    
  finalize_transfer_public_to_private(
    sender: string,
    amount: bigint,
  ) {
    let sender_balance: bigint = this.account.get(sender) || BigInt("0");
    let new_sender_balance: bigint = sender_balance - amount;
    this.account.set(sender, new_sender_balance);
    }
    
  mint_private(
    amount: bigint,
    receiver: string,
  ) {
// assert self.caller == address of core_protocol.aleo;
    let output_record: token = {
    owner: receiver,
    amount: amount
    };
    
    this.finalize_mint_private (amount);
    return output_record;  
}
    
  finalize_mint_private(
    amount: bigint,
  ) {
    let total_minted: bigint = this.totals.get(BigInt("0")) || BigInt("0");
    let new_total_minted: bigint = total_minted + amount;
    this.totals.set(BigInt("0"), new_total_minted);
    }
    
  mint_public(
    amount: bigint,
    receiver: string,
  ) {
// assert self.caller == address of core_protocol.aleo;
    
    return this.finalize_mint_public (amount, receiver);
    }
    
  finalize_mint_public(
    amount: bigint,
    receiver: string,
  ) {
    let total_minted: bigint = this.totals.get(BigInt("0")) || BigInt("0");
    let new_total_minted: bigint = total_minted + amount;
    this.totals.set(BigInt("0"), new_total_minted);
    
    let receiver_balance: bigint = this.account.get(receiver) || BigInt("0");
    let new_receiver_balance: bigint = receiver_balance + amount;
    this.account.set(receiver, new_receiver_balance);
    }
    
  burn_private(
    input_record: token,
    ale_burn_amount: bigint,
    credits_claim_amount: bigint,
    min_block_height: bigint,
  ) {
    assert(this.caller === this.CORE_PROTOCOL);
    let output_token: token = {
    owner: input_record.owner,
    amount: input_record.amount - ale_burn_amount
    };
    let output_claim: claim = {
    owner: input_record.owner,
    amount: credits_claim_amount,
    min_claim_height: min_block_height
    };
    
    this.finalize_burn_private(ale_burn_amount);
    return [output_token, output_claim];  
}
    
  finalize_burn_private(
    amount: bigint,
  ) {
    let total_burned: bigint = this.totals.get(BigInt("1")) || BigInt("0");
    let new_total_burned: bigint = total_burned + amount;
    this.totals.set(BigInt("1"), new_total_burned);
    }
    
  claim_credits(
    claim_record: claim,
  ) {
    assert(this.caller === claim_record.owner);
    
    this.credits.caller = "ale.aleo";
    let credits_record: credits = this.credits.transfer_public_to_private(claim_record.owner, claim_record.amount);
    
    this.finalize_claim_credits(claim_record.amount, claim_record.min_claim_height);
    return [credits_record];  
}
    
  finalize_claim_credits(
    amount: bigint,
    min_claim_height: bigint,
  ) {
    assert(this.block.height >= min_claim_height);
    }
    
  assert_totals(
    total_minted: bigint,
    total_burned: bigint,
  ) {
    return this.finalize_assert_totals(total_minted, total_burned);
    }
    
  finalize_assert_totals(
    total_minted: bigint,
    total_burned: bigint,
  ) {
    let minted: bigint = this.totals.get(BigInt("0")) || BigInt("0");
    let burned: bigint = this.totals.get(BigInt("1")) || BigInt("0");
    
    assert(minted === total_minted);
    assert(burned === total_burned);
    }
    }
