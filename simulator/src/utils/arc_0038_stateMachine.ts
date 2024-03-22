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
import assert from 'assert';

const MICROCREDITS_TO_CREDITS = 1000000;

export interface blockEvent {
  height: bigint;
  action: (program: arc_0038Program) => void;
  verify: (program: arc_0038Program) => void;
}

export class arc_0038_stateMachine {
  credits: creditsProgram;
  arc0038: arc_0038Program;
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
    console.log('- next block height: ' + this.block.height + ' -');
  }

  distributeRewards(delegator: string) {
    if (this.credits.bonded.has(delegator)) {
      const bondedState = this.credits.bonded.get(delegator)!;
      bondedState.microcredits += this.calculateReward(bondedState.microcredits);
      console.log('setting bond: ' + bondedState.microcredits.toLocaleString());
      this.credits.bonded.set(delegator, bondedState);
    }
  }

  calculateReward(microcredits: bigint): bigint {
    return BigInt(24 * MICROCREDITS_TO_CREDITS); // (microcredits * this.REWARD_RATE) / this.arc0038.PRECISION_UNSIGNED;
  }

  simpleTest(blockEvents: blockEvent[]) {
    console.log('Running simple test');
    for (let i = 0; i < 5; i++) {
      this.progressBlock();
      blockEvents.forEach((event) => {
        if (event.height === this.block.height) {
          event.action(this.arc0038);
          event.verify(this.arc0038);
        }
      });
    }
    console.log('Simple test completed successfully');
  }
}

const initializeEvent: blockEvent = {
  height: BigInt(1),
  action: (program: arc_0038Program) => {
    console.log('--initialize--');
    program.caller = program.ADMIN;
    const commission = .05 * Number(program.PRECISION_UNSIGNED);
    program.initialize(BigInt(commission), 'test-validator');
    const inputRecord = {
      owner: program.ADMIN,
      microcredits: program.MINIMUM_BOND_POOL + BigInt(500 * MICROCREDITS_TO_CREDITS),
    };
    const resultRecord = program.initial_deposit(inputRecord, program.MINIMUM_BOND_POOL, 'test-validator');
    assert(resultRecord.microcredits === BigInt(500 * MICROCREDITS_TO_CREDITS), 'Initial deposit failed');
  },
  verify: (program: arc_0038Program) => {
    // initialize
    assert(program.is_initialized.get(BigInt(0)));
    const commission_percent = Number(program.commission_percent.get(BigInt(0)));
    assert(commission_percent / Number(program.PRECISION_UNSIGNED) === .05);
    assert(program.validator.get(BigInt(0)) === 'test-validator');
    assert(program.pending_withdrawal.get(BigInt(0)) === BigInt(0));
    assert(program.current_batch_height.get(BigInt(0)) === BigInt(0));
    // initial_deposit
    assert(program.credits.bonded.has(program.CORE_PROTOCOL), 'Bonded state not set');
    assert(program.credits.bonded.get(program.CORE_PROTOCOL)!.microcredits === program.MINIMUM_BOND_POOL, 'Bonded state not set correctly');
    assert(program.total_balance.get(BigInt(0)) === program.MINIMUM_BOND_POOL, 'Total balance not set correctly');
    assert(program.total_shares.get(BigInt(0)) === program.MINIMUM_BOND_POOL * program.SHARES_TO_MICROCREDITS, 'Total shares not set correctly');
    assert(program.delegator_shares.get(program.ADMIN) === program.MINIMUM_BOND_POOL * program.SHARES_TO_MICROCREDITS, 'Admin shares not set correctly');
  },
};

const depositEvent: blockEvent = {
  height: BigInt(2),
  action: (program: arc_0038Program) => {
    console.log('--deposit--');
    program.caller = 'user0';
    const inputRecord = {
      owner: 'user0',
      microcredits: BigInt(1000.1 * MICROCREDITS_TO_CREDITS),
    };
    const deposit = BigInt(.1 * MICROCREDITS_TO_CREDITS);
    const resultRecord = program.deposit_public(inputRecord, deposit);
    assert(resultRecord.microcredits === BigInt(1000 * MICROCREDITS_TO_CREDITS), 'Deposit failed');
  },
  verify: (program: arc_0038Program) => {
    // assume 10% reward rate
    const deposit = BigInt(.1 * MICROCREDITS_TO_CREDITS);
    assert(program.credits.account.get(program.CORE_PROTOCOL) === deposit, 'Account not updated');
    // assert(program.credits.bonded.get(program.CORE_PROTOCOL)!.microcredits === BigInt(10100 * MICROCREDITS_TO_CREDITS), 'Bonded state not updated');
    // assert(program.total_balance.get(BigInt(0)) === BigInt(10200 * MICROCREDITS_TO_CREDITS), 'Total balance not set correctly');
    // assert(program.total_shares.get(BigInt(0)) === BigInt(10004948900000 + 99058900000), `Total shares not set correctly: ${program.total_shares.get(BigInt(0))}`);
    // assert(program.delegator_shares.get('user0') === BigInt(99058900000), `User shares not set correctly: ${program.delegator_shares.get('user0')}`);
    // assert(program.delegator_shares.get(program.ADMIN) === BigInt(10004948900000), `Admin shares not set correctly: ${program.delegator_shares.get(program.ADMIN)}`);
  },
};

const bondAllEvent: blockEvent = {
  height: BigInt(6),
  action: (program: arc_0038Program) => {
    console.log('--bond_all--');
    program.caller = 'user0';
    program.bond_all('test-validator', BigInt(.1 * MICROCREDITS_TO_CREDITS));
  },
  verify: (program: arc_0038Program) => {
    // verify
  },
};

const withdrawEvent: blockEvent = {
  height: BigInt(5),
  action: (program: arc_0038Program) => {
    console.log('--withdraw--');
    program.caller = 'user0';
    const all_shares = program.delegator_shares.get('user0')!;
    program.withdraw_public(all_shares, BigInt(.1 * MICROCREDITS_TO_CREDITS));
  },
  verify: (program: arc_0038Program) => {
    assert(program.withdrawals.has('user0'));
    assert(program.credits.unbonding.has(program.CORE_PROTOCOL));
  },
};

let stateMachine = new arc_0038_stateMachine();
stateMachine.simpleTest([initializeEvent, depositEvent, bondAllEvent, withdrawEvent]);