import assert from 'assert';

import { arc_0038Program } from '../src/contracts/arc_0038';
import { MICROCREDITS_TO_CREDITS } from '../src/contracts/credits';
import { blockEvent, StateMachine } from '../src/utils/ARC-0038/StateMachine';
import {
    admin, bondAll, bondDeposits, claimUnbond, claimWithdrawPublic, createWithdrawClaim, deposit, initialDeposit, initialize, setNextValidator, testValidator, unbondAll, user0, user1, user2, user3, user4,
    withdrawPublic
} from '../src/utils/ARC-0038/transition-definitions';
import {
    createBondDepositsEvent, createClaimCommissionEvent, createClaimUnbondEvent, createDepositEvent,
    createInitializeEvent, createWithdrawPublicEvent
} from '../src/utils/ARC-0038/transitions';

const jestConsole = console;

describe('ARC0038', () => {
  let stateMachine: StateMachine;
  let program: arc_0038Program;

  beforeEach(() => {
    stateMachine = new StateMachine();
    program = stateMachine.arc0038;
    global.console = require('console');
    const oneMillionCredits = 1000000 * MICROCREDITS_TO_CREDITS;
    program.credits.account.set(admin, BigInt(oneMillionCredits));
    program.credits.account.set(user0, BigInt(oneMillionCredits));
    program.credits.account.set(user1, BigInt(oneMillionCredits));
    program.credits.account.set(user2, BigInt(oneMillionCredits));
    program.credits.account.set(user3, BigInt(oneMillionCredits));
    program.credits.account.set(user4, BigInt(oneMillionCredits));
  });

  afterEach(() => {
    global.console = jestConsole;
  });

  xit('simple test', () => {
    const commission = .05 * Number(program.PRECISION_UNSIGNED);
    const validator = 'test-validator';
    const initializeEvent = createInitializeEvent(commission, validator);

    const user1 = 'user0';
    const deposit1 = BigInt(50 * MICROCREDITS_TO_CREDITS);
    const depositEvent = createDepositEvent(BigInt(2), deposit1, user1, true, BigInt(49886259328), BigInt(10001197270223), BigInt(10024 * MICROCREDITS_TO_CREDITS));

    const claimCommissionEvent = createClaimCommissionEvent(BigInt(3), true, BigInt(10001197270223 + 1194566618), BigInt(10048 * MICROCREDITS_TO_CREDITS), deposit1);

    const withdrawShares = BigInt(0);
    const withdrawPublicEvent = createWithdrawPublicEvent(BigInt(4), user1, withdrawShares, deposit1, true, BigInt(10001197270223 + 1194566618 + 1191875515));

    const user2 = 'user1';
    const deposit2 = BigInt(100 * MICROCREDITS_TO_CREDITS);
    const depositEvent2 = createDepositEvent(BigInt(5), deposit2, user2, false);

    const bondDepositsEvent = createBondDepositsEvent(BigInt(7), user1, validator, deposit1 + deposit2, false, BigInt(0));

    const earlyClaim: blockEvent = {
      height: BigInt(8),
      act: (program: arc_0038Program) => {
        console.log('--early_claim--');
        let seenError = false;
        try {
          program.claim_withdrawal_public(user1, deposit1);
        } catch (e: any) {
          seenError = true;
        }
        assert(seenError);
      }
    };

    // unallowed withdrawal
    const unallowedWithdrawal: blockEvent = {
      height: BigInt(641),
      act: (program: arc_0038Program) => {
        console.log('--batch miss--');
        let seenError = false;
        try {
          const shares = program.delegator_shares.get(user2)!;
          program.caller = user2;
          program.withdraw_public(shares, deposit2);
        } catch (e: any) {
          seenError = true;
          assert(e.stack.includes('finalize_withdraw_public'));
        }
        assert(seenError);
      }
    };

    // claim unbond
    const claimUnbondEvent = createClaimUnbondEvent(BigInt(1000), user1);

    const incorrectAmountClaim: blockEvent = {
      height: BigInt(1000),
      act: (program: arc_0038Program) => {
        console.log('--incorrect_claim--');
        let seenError = false;
        try {
          program.claim_withdrawal_public(user1, deposit2);
        } catch (e: any) {
          seenError = true;
        }
        assert(seenError);
      }
    };

    const correctClaim: blockEvent = {
      height: BigInt(1000),
      act: (program: arc_0038Program) => {
        console.log('--correct_claim--');
        program.claim_withdrawal_public(user1, deposit1);
      }
    };

    //stateMachine.setVerboseHeights(999);
    stateMachine.test([
      initializeEvent,
      depositEvent,
      claimCommissionEvent,
      withdrawPublicEvent,
      depositEvent2,
      bondDepositsEvent,
      unallowedWithdrawal,
      earlyClaim,
      claimUnbondEvent,
      incorrectAmountClaim,
      correctClaim
    ], 'simple test', 1001);
  });

  it('changing validator', () => {
    const transitions = [
      initialize(1, 0.9, testValidator, admin, true),
      initialize(1, 0.05, testValidator, user0, true),
      initialize(),
      deposit(1, 5 * MICROCREDITS_TO_CREDITS, user0, true),
      initialDeposit(2),
      initialize(3, 0.05, testValidator, admin, true),
      deposit(3, 5 * MICROCREDITS_TO_CREDITS, user0),
      withdrawPublic(4, user0, 1.1, 2505683, true),
      withdrawPublic(4, user0, .5, 2505683),
      setNextValidator(4, 'new-validator', admin, false),
      unbondAll(5, user0, 2505683, true),
      unbondAll(5, user1, 10060000000, false),
      withdrawPublic(6, user0, .1, 250, true),
      deposit(7, 50 * MICROCREDITS_TO_CREDITS, user1),
      claimUnbond(365, user0),
      createWithdrawClaim(366, user1, .5),
      claimWithdrawPublic(366, user0, 2505683, true),
      bondDeposits(367, 55 * MICROCREDITS_TO_CREDITS, 'new-validator', user1, true),
      bondAll(367, 11000000000, 'new-validator', user1, true),
      bondAll(367, 10060000000, '-validator', user1, true),
      deposit(367, 100 * MICROCREDITS_TO_CREDITS, user2),
      bondAll(367, 10090000000, 'new-validator', user1),
      claimWithdrawPublic(1000, user0, 2505683),
    ];

    stateMachine.setVerbose(true);
    stateMachine.setVerboseHeights(999);
    stateMachine.runTransitions(transitions, 'changing validator', 1000);
  });
});