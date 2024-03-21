/*
inputs: state transitions/events, with an associated block
  - use certain values for each event
  - potentially simulate rewards or use bonded balance as input
examine the contract state after each event
progress the block height within a for loop

progressBlock() should increment block height and give rewards
*/

import { arc_0038Program } from '../contracts/arc_0038';
import { creditsProgram } from '../contracts/credits';

export class StateMachineARC0038 {
  credits: creditsProgram;
  arc0038: arc_0038Program;
  REWARD_RATE = BigInt(0.01);
  block: {
    height: bigint;
  } = { height: BigInt(0) };

  constructor() {
    this.credits = new creditsProgram();
    this.arc0038 = new arc_0038Program(this.credits);
    this.credits.block = this.arc0038.block = this.block;
  }

  progressBlock() {
    this.distributeRewards(this.arc0038.CORE_PROTOCOL);
    this.block.height += BigInt(1);
  }

  distributeRewards(delegator: string) {
    if (this.credits.bonded.has(delegator)) {
      const bondedState = this.credits.bonded.get(delegator)!;
      bondedState.microcredits += this.calculateReward(bondedState.microcredits);
      this.credits.bonded.set(delegator, bondedState);
    }
  }

  calculateReward(microcredits: bigint): bigint {
    return microcredits * this.REWARD_RATE;
  }

}