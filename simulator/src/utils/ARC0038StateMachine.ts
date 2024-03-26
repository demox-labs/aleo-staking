/*
inputs: state transitions/events, with an associated block
  - use certain values for each event
  - potentially simulate rewards or use bonded balance as input
examine the contract state after each event
progress the block height within a for loop

progressBlock() should increment block height and give rewards
*/

import { arc_0038Program } from '../contracts/arc_0038';
import { MICROCREDITS_TO_CREDITS, MINIMUM_BOND_POOL, bond_state, creditsProgram } from '../contracts/credits';

export interface blockEvent {
  height: bigint;
  action: (program: arc_0038Program) => void;
  verify: (program: arc_0038Program) => void;
}

export class ARC0038StateMachine {
  credits: creditsProgram;
  arc0038: arc_0038Program;
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  verbose: boolean = false;
  verboseStartHeight?: bigint;
  verboseEndHeight?: bigint;

  constructor() {
    this.credits = new creditsProgram();
    this.arc0038 = new arc_0038Program(this.credits);
    this.credits.block = this.arc0038.block = this.block;
  }

  updateVerboseForHeight(height: bigint) {
    if (this.verboseStartHeight === undefined || this.verboseEndHeight === undefined) {
      return;
    }
    if (height >= this.verboseStartHeight && height <= this.verboseEndHeight) {
      this.verbose = true;
    } else {
      this.verbose = false;
    }
  }

  setVerbose(startHeight: bigint, endHeight: bigint) {
    this.verboseStartHeight = startHeight;
    this.verboseEndHeight = endHeight;
  }

  progressBlock() {
    this.updateVerboseForHeight(this.block.height);
    const protocol = this.arc0038.CORE_PROTOCOL;
    if (this.verbose) {
      console.log(`total balance: ${this.arc0038.total_balance.get(BigInt(0))?.toLocaleString() || '0'}`);
      console.log(`bonded: ${printBondState(this.credits.bonded.get(protocol))}`);
      console.log(`balance in account: ${this.credits.account.get(protocol)?.toLocaleString() || '0'}`);
      console.log(`total shares: ${this.arc0038.total_shares.get(BigInt(0))?.toLocaleString() || '0'}`);
    }
    this.distributeRewards(protocol);
    if (this.verbose) {
      console.log('bonded after rewards: ' + printBondState(this.credits.bonded.get(protocol)));
      console.log(`--- END BLOCK ${this.block.height.toLocaleString()} ---`);
      console.log(`--- START BLOCK ${(this.block.height + BigInt(1)).toLocaleString()} ---`);
    }
    this.block.height += BigInt(1);
  }

  distributeRewards(delegator: string) {
    if (this.credits.bonded.has(delegator)) {
      const bondedState = this.credits.bonded.get(delegator)!;
      bondedState.microcredits += this.calculateReward(bondedState.microcredits);
      if (this.verbose) {
        console.log('delegators:');
        this.arc0038.delegator_shares.forEach(printSharesLine);
      }
      this.credits.bonded.set(delegator, bondedState);
    }
  }

  calculateReward(microcredits: bigint): bigint {
    return BigInt(24 * MICROCREDITS_TO_CREDITS); // (microcredits * this.REWARD_RATE) / this.arc0038.PRECISION_UNSIGNED;
  }

  test(blockEvents: blockEvent[], title: string = 'Simple test', iterations: number = 5) {
    console.log(`Running ${title}...`);
    for (let i = 0; i < iterations; i++) {
      this.progressBlock();
      blockEvents.forEach((event) => {
        if (event.height === this.block.height) {
          event.action(this.arc0038);
          event.verify(this.arc0038);
        }
      });
    }
    console.log(`${title}: SUCCESS`);
  }
}

const printSharesLine = (shares: bigint, delegator: string) => {
  console.log(`  ${delegator}: ${shares.toLocaleString()} shares`);
};

const printBondState = (bonded?: bond_state) => {
  if (!bonded) {
    return '0';
  }

  return `${bonded.microcredits.toLocaleString()}, validator: ${bonded.validator}`;
};
