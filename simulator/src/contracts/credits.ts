export interface credits {
  owner: string;
  microcredits: bigint;
}

export interface bonded {
  validator: string;
  microcredits: bigint;
}

export interface unbonding {
  microcredits: bigint;
  height: bigint;
}

export class creditsProgram {
  caller: string = "not set";
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  account: Map<string, bigint> = new Map();
  bonded: Map<string, bigint> = new Map();
  unbonding: Map<string, bigint> = new Map();

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
    const recipientBalance: bigint = this.account.get(recipient)!;
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
    const bonded: bigint = this.bonded.get(delegator) || BigInt(0);
  }

  unbond_public(
    amount: bigint
  ) {

  }

  claim_unbond_public() {

  }
}