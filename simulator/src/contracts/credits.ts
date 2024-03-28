import assert from 'assert';

export const MINIMUM_BOND_POOL = BigInt(10000000000);
export const MICROCREDITS_TO_CREDITS = 1000000;

export interface credits {
  owner: string;
  microcredits: bigint;
}

export interface bond_state {
  validator: string;
  microcredits: bigint;
}

export interface unbond_state {
  microcredits: bigint;
  height: bigint;
}

export class creditsProgram {
  caller: string = "not set";
  signer: string = "not set";
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  UNBONDING_PERIOD = BigInt("360");
  account: Map<string, bigint> = new Map();
  bonded: Map<string, bond_state> = new Map();
  unbonding: Map<string, unbond_state> = new Map();
  committee: Set<string> = new Set(['test-validator', 'new-validator']);

  transfer_public_to_private(
    receiver: string,
    amount: bigint,
  ) {
    const receiverRecord: credits = {
        owner: receiver,
        microcredits: amount
      };

    this.finalize_transfer_public_to_private(this.caller, amount);
    return receiverRecord;
  }

  finalize_transfer_public_to_private(
    sender: string,
    amount: bigint
  ) {
    const senderBalance: bigint = this.account.get(sender)!;
    const newSenderBalance: bigint = senderBalance - amount;
    this.account.set(sender, newSenderBalance);
  }

  transfer_private_to_public(
    input_record: credits,
    recipient: string,
    amount: bigint
  ): credits {
    const recipientBalance: bigint = this.account.get(recipient) || BigInt(0);
    const newRecipientBalance: bigint = recipientBalance + amount;
    this.account.set(recipient, newRecipientBalance);
    input_record.microcredits -= amount;

    return input_record;
  }

  transfer_public(
    recipient: string,
    amount: bigint
  ) {
    this.finalize_transfer_public(this.caller, recipient, amount);
  }

  finalize_transfer_public(
    sender: string,
    recipient: string,
    amount: bigint
  ) {
    const senderBalance: bigint = this.account.get(sender)!;
    const newSenderBalance: bigint = senderBalance - amount;
    assert(newSenderBalance >= BigInt(0), "insufficient balance");
    this.account.set(sender, newSenderBalance);

    const recipientBalance: bigint = this.account.get(recipient) || BigInt(0);
    const newRecipientBalance: bigint = recipientBalance + amount;
    this.account.set(recipient, newRecipientBalance);
  }

  transfer_public_as_signer(
    recipient: string,
    amount: bigint
  ) {
    this.finalize_transfer_public(this.signer, recipient, amount);
  }

  bond_public(
    validator: string,
    amount: bigint
  ) {
    this.finalize_bond_public(this.caller, validator, amount);
  }

  finalize_bond_public(
    delegator: string,
    validator: string,
    amount: bigint
  ) {
    assert(this.committee.has(validator));
    const bonded: bond_state = this.bonded.get(delegator) || { microcredits: BigInt(0), validator: validator };
    assert(bonded.validator === validator, "bonded to different validator");
    assert(bonded.microcredits !== BigInt(0) || amount >= BigInt(MINIMUM_BOND_POOL), "minimum bond amount not met");
    assert(bonded.microcredits === BigInt(0) || amount >= BigInt(1 * MICROCREDITS_TO_CREDITS), "must bond at least 1 credit");

    bonded.microcredits += amount;
    const newSenderBalance: bigint = this.account.get(delegator)! - amount;
    this.bonded.set(delegator, bonded);assert(newSenderBalance >= BigInt(0), "insufficient balance");
    this.account.set(delegator, newSenderBalance);
  }

  unbond_public(
    amount: bigint
  ) {
    this.finalize_unbond_public(this.caller, amount);
  }

  finalize_unbond_public(
    delegator: string,
    amount: bigint
  ) {
    const bonded: bond_state | undefined = this.bonded.get(delegator);
    assert(bonded !== undefined, "not bonded");
    assert(bonded!.microcredits >= amount, "insufficient credits to unbond");

    let unbondAmount = amount;
    const remainingBond: bigint = bonded!.microcredits - amount;
    if (remainingBond < BigInt(MINIMUM_BOND_POOL)) {
      unbondAmount = bonded!.microcredits;
      this.bonded.delete(delegator);
    } else {
      bonded!.microcredits = remainingBond;
      this.bonded.set(delegator, bonded!);
    }

    const unbonding: unbond_state = this.unbonding.get(delegator) || { microcredits: BigInt(0), height: this.block.height };
    unbonding.microcredits += unbondAmount;
    unbonding.height = this.block.height + this.UNBONDING_PERIOD;
    this.unbonding.set(delegator, unbonding);
  }

  claim_unbond_public() {
    this.finalize_claim_unbond_public(this.caller);
  }

  finalize_claim_unbond_public(
    delegator: string
  ) {
    const unbonding: unbond_state | undefined = this.unbonding.get(delegator);
    assert(unbonding !== undefined, "not unbonding");
    assert(this.block.height >= unbonding!.height, `unbonding period has not passed ${this.block.height} ${unbonding!.height}`);

    const credits: bigint = unbonding!.microcredits;
    this.unbonding.delete(delegator);
    this.account.set(delegator, this.account.get(delegator)! + credits);
  }
}