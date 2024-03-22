import assert from 'assert';

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
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  UNBONDING_PERIOD = BigInt("360");
  account: Map<string, bigint> = new Map();
  bonded: Map<string, bond_state> = new Map();
  unbonding: Map<string, unbond_state> = new Map();

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
    this.account.set(sender, newSenderBalance);

    const recipientBalance: bigint = this.account.get(recipient)!;
    const newRecipientBalance: bigint = recipientBalance + amount;
    this.account.set(recipient, newRecipientBalance);
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
    const bonded: bond_state = this.bonded.get(delegator) || { microcredits: BigInt(0), validator: validator };
    assert(bonded.validator == validator, "bonded to different validator");

    bonded.microcredits += amount;
    this.bonded.set(delegator, bonded);
    this.account.set(delegator, this.account.get(delegator)! - amount);
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

    const unbonding: unbond_state = this.unbonding.get(delegator) || { microcredits: BigInt(0), height: this.block.height };
    unbonding.microcredits += amount;
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
    assert(this.block.height >= unbonding!.height, "unbonding period has not passed");

    const credits: bigint = unbonding!.microcredits;
    this.unbonding.delete(delegator);
    this.account.set(delegator, this.account.get(delegator)! + credits);
  }
}