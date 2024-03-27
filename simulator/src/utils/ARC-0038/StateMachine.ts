import assert from 'assert';
import { arc_0038Program, withdrawal_state } from '../../contracts/arc_0038';
import { MICROCREDITS_TO_CREDITS, bond_state, creditsProgram } from '../../contracts/credits';

export interface blockEvent {
  height: bigint;
  act: (program: arc_0038Program) => void;
}

export enum TransitionType {
  Initialize,
  InitialDeposit,
  SetCommissionPercent,
  SetNextValidator,
  UnbondAll,
  ClaimUnbond,
  BondAll,
  BondDeposits,
  ClaimCommission,
  Deposit,
  WithdrawPublic,
  CreateWithdrawClaim,
  ClaimWithdrawPublic
}

export interface Transition {
  type: TransitionType;
  height: bigint;
  caller: string;
  shouldFail?: boolean;
  commission?: bigint;
  validator?: string;
  amount?: bigint;
  recipient?: string;
  sharesPercent?: number;
  additionalAction?: (program: StateMachine) => void;
}

export class StateMachine {
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
    if (this.verboseStartHeight === undefined) {
      return;
    }
    if (height >= this.verboseStartHeight && (!this.verboseEndHeight || height <= this.verboseEndHeight)) {
      this.verbose = true;
    } else {
      this.verbose = false;
    }
  }

  setVerbose(verbose: boolean) {
    this.verbose = verbose;
  }

  setVerboseHeights(startHeight: bigint | number, endHeight?: bigint | number) {
    this.verboseStartHeight = BigInt(startHeight);
    if (endHeight !== undefined) {
      this.verboseEndHeight = BigInt(endHeight);
    }
  }

  progressBlock() {
    this.updateVerboseForHeight(this.block.height);
    if (this.verbose) {
      this.printBalances();
    }
    this.distributeRewards(this.arc0038.CORE_PROTOCOL);
    if (this.verbose) {
      this.printBlockChange();
    }
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
    return BigInt(24 * MICROCREDITS_TO_CREDITS); // (microcredits * this.REWARD_RATE) / this.arc0038.PRECISION_UNSIGNED;
  }

  test(blockEvents: blockEvent[], title: string = 'Simple test', iterations: number = 5) {
    console.log(`Running ${title}...`);
    if (this.verbose) {
      console.log(`--- START BLOCK 0 ---`);
    }
    for (let i = 0; i < iterations; i++) {
      this.progressBlock();
      blockEvents.forEach((event) => {
        if (event.height === this.block.height) {
          event.act(this.arc0038);
        }
      });
    }
    if (this.verbose) {
      this.printBalances();
      console.log(`--- END BLOCK ${this.block.height.toLocaleString()} ---`);
    }
    console.log(`${title}: SUCCESS`);
  }

  runTransitions(transitions: Transition[], title: string = '', iterations: number = 5) {
    const blockToTransition: Map<bigint, Transition[]> = new Map();
    transitions.forEach((transition) => {
      if (!blockToTransition.has(transition.height)) {
        blockToTransition.set(transition.height, []);
      }
      blockToTransition.get(transition.height)?.push(transition);
    });

    console.log(`Running ${title}...`);
    if (this.verbose) {
      console.log(`--- START BLOCK 0 ---`);
    }
    for (let i = 0; i < iterations; i++) {
      this.progressBlock();
      if (blockToTransition.has(this.block.height)) {
        blockToTransition.get(this.block.height)?.forEach((transition) => this.runTransition(transition));
      }
    }

    if (this.verbose) {
      this.printBalances();
      console.log(`--- END BLOCK ${this.block.height.toLocaleString()} ---`);
    }
    console.log(`Finished running ${title}`);
  }

  runTransition(transition: Transition) {
    switch (transition.type) {
      case TransitionType.Initialize:
        let failed = false;
        this.arc0038.caller = transition.caller;
        try {
          this.arc0038.initialize(transition.commission!, transition.validator!);
        } catch (e: any) {
          failed = true;
          if (!transition.shouldFail) {
            throw e;
          }
        }
        assert(failed == transition.shouldFail);
        break;
      case TransitionType.InitialDeposit:
        failed = false;
        this.arc0038.caller = transition.caller;
        try {
          this.arc0038.initial_deposit(transition.amount!, transition.validator!);
        } catch (e: any) {
          failed = true;
          if (!transition.shouldFail) {
            throw e;
          }
        }
        assert(failed == transition.shouldFail);
        break;
      case TransitionType.SetCommissionPercent:
        failed = false;
        this.arc0038.caller = transition.caller;
        try {
          this.arc0038.set_commission_percent(transition.commission!);
        } catch (e: any) {
          failed = true;
          if (!transition.shouldFail) {
            throw e;
          }
        }
        assert(failed == transition.shouldFail);
        break;
      case TransitionType.SetNextValidator:
        failed = false;
        this.arc0038.caller = transition.caller;
        try {
          this.arc0038.set_next_validator(transition.validator!);
        } catch (e: any) {
          failed = true;
          if (!transition.shouldFail) {
            throw e;
          }
        }
        assert(failed == transition.shouldFail);
        break;
      case TransitionType.UnbondAll:
        failed = false;
        this.arc0038.caller = transition.caller;
        try {
          this.arc0038.unbond_all(transition.amount!);
        } catch (e: any) {
          failed = true;
          if (!transition.shouldFail) {
            throw e;
          }
        }
        assert(failed == transition.shouldFail);
        break;
      case TransitionType.ClaimUnbond:
        failed = false;
        this.arc0038.caller = transition.caller;
        try {
          this.arc0038.claim_unbond();
        } catch (e: any) {
          failed = true;
          if (!transition.shouldFail) {
            throw e;
          }
        }
        assert(failed == transition.shouldFail);
        break;
      case TransitionType.BondAll:
        failed = false;
        this.arc0038.caller = transition.caller;
        try {
          this.arc0038.bond_all(transition.validator!, transition.amount!);
        } catch (e: any) {
          failed = true;
          if (!transition.shouldFail) {
            throw e;
          }
        }
        assert(failed == transition.shouldFail);
        break;
      case TransitionType.BondDeposits:
        failed = false;
        this.arc0038.caller = transition.caller;
        try {
          this.arc0038.bond_deposits(transition.validator!, transition.amount!);
        } catch (e: any) {
          failed = true;
          if (!transition.shouldFail) {
            throw e;
          }
        }
        assert(failed == transition.shouldFail);
        break;
      case TransitionType.ClaimCommission:
        failed = false;
        this.arc0038.caller = transition.caller;
        try {
          this.arc0038.claim_commission();
        } catch (e: any) {
          failed = true;
          if (!transition.shouldFail) {
            throw e;
          }
        }
        assert(failed == transition.shouldFail);
        break;
      case TransitionType.Deposit:
        failed = false;
        this.arc0038.caller = transition.caller;
        try {
          this.arc0038.deposit_public(transition.amount!);
        } catch (e: any) {
          failed = true;
          if (!transition.shouldFail) {
            throw e;
          }
        }
        assert(failed == transition.shouldFail);
        break;
      case TransitionType.WithdrawPublic:
        failed = false;
        this.arc0038.caller = transition.caller;
        try {
          const userShares = this.arc0038.delegator_shares.get(transition.caller)!;
          const sharesDecimal = transition.sharesPercent! * Number(userShares);
          const sharesToWithdraw = BigInt(Math.floor(sharesDecimal));
          this.arc0038.withdraw_public(sharesToWithdraw, transition.amount!);
        } catch (e: any) {
          failed = true;
          if (!transition.shouldFail) {
            throw e;
          }
        }
        assert(failed == transition.shouldFail);
        break;
      case TransitionType.CreateWithdrawClaim:
        failed = false;
        this.arc0038.caller = transition.caller;
        try {
          const userShares = this.arc0038.delegator_shares.get(transition.caller)!;
          const sharesDecimal = transition.sharesPercent! * Number(userShares);
          const sharesToWithdraw = BigInt(Math.floor(sharesDecimal));
          this.arc0038.create_withdraw_claim(sharesToWithdraw);
        } catch (e: any) {
          failed = true;
          if (!transition.shouldFail) {
            throw e;
          }
        }
        assert(failed == transition.shouldFail);
        break;
      case TransitionType.ClaimWithdrawPublic:
        failed = false;
        this.arc0038.caller = transition.caller;
        try {
          this.arc0038.claim_withdrawal_public(transition.recipient!, transition.amount!);
        } catch (e: any) {
          failed = true;
          if (!transition.shouldFail) {
            throw e;
          }
        }
        assert(failed == transition.shouldFail);
        break;
    }
    if (transition.additionalAction) {
      transition.additionalAction(this);
    }
  }

  printBalances() {
    const protocol = this.arc0038.CORE_PROTOCOL;
    console.log(`total balance:        ${this.arc0038.total_balance.get(BigInt(0))?.toLocaleString() || '0'}`);
    console.log(`bonded:               ${printBondState(this.credits.bonded.get(protocol))}`);
    console.log(`balance in account:   ${this.credits.account.get(protocol)?.toLocaleString() || '0'}`);
    console.log(`pending deposits:     ${this.arc0038.pending_deposits.get(BigInt(0))?.toLocaleString() || '0'}`);
    console.log(`pending withdrawals:  ${this.arc0038.pending_withdrawal.get(BigInt(0))?.toLocaleString() || '0'}, ${this.arc0038.pending_withdrawal.get(BigInt(1))?.toLocaleString() || '0'}`);
    console.log(`total shares:         ${this.arc0038.total_shares.get(BigInt(0))?.toLocaleString() || '0'}`);
    console.log('delegators:');
    this.arc0038.delegator_shares.forEach((balance: bigint, account: string) => printBalanceLine(balance, account, ' shares'));
    console.log('withdrawals:');
    this.arc0038.withdrawals.forEach(printWithdrawal);
    console.log(`unbonding:            ${this.credits.unbonding.get(protocol)?.microcredits.toLocaleString() || '0'}`);
  }

  printBlockChange() {
    console.log('bonded after rewards: ' + printBondState(this.credits.bonded.get(this.arc0038.CORE_PROTOCOL)));
    console.log(`--- END BLOCK ${this.block.height.toLocaleString()} ---`);
    console.log(`--- START BLOCK ${(this.block.height + BigInt(1)).toLocaleString()} ---`);
  }

  printCreditsBalances(delta: bigint = BigInt(0)) {
    console.log('credits balances:');
    this.credits.account.forEach((balance: bigint, account: string) => printBalanceLine(balance - delta, account));
  }
}

const printBalanceLine = (balance: bigint, account: string, suffix: string = '') => {
  if (account === 'arc_0038.aleo') {
    account = 'arc38';
  }

  console.log(`  ${account}:              ${balance.toLocaleString()}`);
};

const printBondState = (bonded?: bond_state) => {
  if (!bonded) {
    return '0';
  }

  return `${bonded.microcredits.toLocaleString()}, validator: ${bonded.validator}`;
};

const printWithdrawal = (withdrawal: withdrawal_state, delegator: string) => {
  console.log(`  ${delegator}:              ${withdrawal.microcredits.toLocaleString()}, block: ${withdrawal.claim_block.toLocaleString()}`);
};
