import assert from 'assert';

import { arc_0038Program } from '../src/contracts/arc_0038';
import { MICROCREDITS_TO_CREDITS } from '../src/contracts/credits';
import { blockEvent, StateMachine } from '../src/utils/ARC-0038/StateMachine';
import {
  admin, bondAll, bondDeposits, claimCommission, claimUnbond, claimWithdrawPublic, createWithdrawClaim, deposit,
  initialDeposit, initialize, precision, setNextValidator, testValidator, unbondAll, user0, user1, user2,
  user3, user4, withdrawPublic
} from '../src/utils/ARC-0038/transition-definitions';
import {
  createBondDepositsEvent, createClaimCommissionEvent, createClaimUnbondEvent, createDepositEvent,
  createInitializeEvent, createWithdrawPublicEvent
} from '../src/utils/ARC-0038/transitions-old';
import { stat } from 'fs';

const jestConsole = console;
const oneMillionCredits = 1000000 * MICROCREDITS_TO_CREDITS;

describe('ARC0038', () => {
  let stateMachine: StateMachine;
  let program: arc_0038Program;

  beforeEach(() => {
    stateMachine = new StateMachine();
    program = stateMachine.arc0038;
    initializeBalances();
    global.console = require('console');
  });

  afterEach(() => {
    global.console = jestConsole;
  });

  const initializeBalances = () => {
    program.credits.account.set(admin, BigInt(oneMillionCredits));
    program.credits.account.set(user0, BigInt(oneMillionCredits));
    program.credits.account.set(user1, BigInt(oneMillionCredits));
    program.credits.account.set(user2, BigInt(oneMillionCredits));
    program.credits.account.set(user3, BigInt(oneMillionCredits));
    program.credits.account.set(user4, BigInt(oneMillionCredits));
  };

  it('simple test', () => {
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
        let seenError = false;
        try {
          program.claim_withdrawal_public(user1, deposit1);
        } catch (e: any) {
          seenError = true;
        }
        assert(seenError);
      }
    };

    const unallowedWithdrawal: blockEvent = {
      height: BigInt(641),
      act: (program: arc_0038Program) => {
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

    const claimUnbondEvent = createClaimUnbondEvent(BigInt(1000), user1);

    const incorrectAmountClaim: blockEvent = {
      height: BigInt(1000),
      act: (program: arc_0038Program) => {
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
        program.claim_withdrawal_public(user1, deposit1);
      }
    };

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
      initialDeposit(1, 10000 * MICROCREDITS_TO_CREDITS, admin, testValidator, true), // not initialized
      initialize(1, 0.9, testValidator, admin, true), // commission too high
      initialize(1, 0.05, testValidator, user0, true), // not admin
      initialize(),
      deposit(1, 5 * MICROCREDITS_TO_CREDITS, user0, true), // before initial deposit
      initialDeposit(2, 10000 * MICROCREDITS_TO_CREDITS, user0, testValidator, true), // not admin
      initialDeposit(2),
      initialDeposit(2, 10000 * MICROCREDITS_TO_CREDITS, admin, testValidator, true), // already initialized
      initialize(3, 0.05, testValidator, admin, true), // already initialized
      deposit(3, 5 * MICROCREDITS_TO_CREDITS, user0),
      withdrawPublic(4, user0, 1.1, 2505683, true), // not enough shares
      withdrawPublic(4, user0, .5, 2505683),
      setNextValidator(4, 'new-validator', admin, false),
      unbondAll(5, user0, 2505683, true), // doesn't fully unbond
      unbondAll(5, user1, 10060000000, false),
      withdrawPublic(6, user0, .1, 250, true), // already withdrawing
      deposit(7, 50 * MICROCREDITS_TO_CREDITS, user1),
      withdrawPublic(8, user1, .5, 2505683, true), // can't withdraw during unbond all
      claimUnbond(365, user0),
      createWithdrawClaim(366, user1, .5),
      claimWithdrawPublic(366, user0, 2505683, user0, true), // too early
      bondDeposits(367, 55 * MICROCREDITS_TO_CREDITS, 'new-validator', user1, true), // switching validators
      bondAll(367, 11000000000, 'new-validator', user1, true), // too much
      bondAll(367, 10060000000, testValidator, user1, true), // wrong validator
      deposit(367, 100 * MICROCREDITS_TO_CREDITS, user2),
      bondAll(367, 10090000000, 'new-validator', user1),
      claimWithdrawPublic(1000, user0, 2505682, user0, true), // wrong amount
      claimWithdrawPublic(1000, user0, 2505683, user0),
      claimWithdrawPublic(1000, admin, 24999999, user1, false, (stateMachine: StateMachine) => stateMachine.printCreditsBalances(BigInt(oneMillionCredits))),
    ];

    //stateMachine.setVerbose(true);
    //stateMachine.setVerboseHeights(0, 4);
    stateMachine.runTransitions(transitions, 'changing validator', 1000);
  });

  xit('deposit every block to minimize commission', () => {
    const smallDeposit = 1;
    let adminBalanceMultipleDeposits: bigint;
    let adminBalanceOneDeposit: bigint;
    let depositorBalanceMultipleDeposits: bigint;
    let depositorBalanceOneDeposit: bigint;
    const transitions = [
      initialize(1, 0.05, testValidator, admin),
      initialDeposit(2),
      deposit(3, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(4, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(5, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(6, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(7, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(8, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(9, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(10, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(11, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(12, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(13, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(14, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(15, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(16, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(17, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(18, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(19, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(20, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(21, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(22, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(23, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(24, smallDeposit * MICROCREDITS_TO_CREDITS, user0),
      deposit(25, smallDeposit * MICROCREDITS_TO_CREDITS, user0, false, (stateMachine) => {
        let totalBalance = stateMachine.arc0038.total_balance.get(BigInt(0));
        let pendingDeposits = stateMachine.arc0038.pending_deposits.get(BigInt(0));
        let fullPool = totalBalance! + pendingDeposits!;
        let totalShares = stateMachine.arc0038.total_shares.get(BigInt(0));
        let adminShares = stateMachine.arc0038.delegator_shares.get(admin)!;
        adminBalanceMultipleDeposits = (adminShares * fullPool * program.PRECISION_UNSIGNED) / (totalShares! * program.PRECISION_UNSIGNED);
        depositorBalanceMultipleDeposits = (stateMachine.arc0038.delegator_shares.get(user0)! * fullPool * program.PRECISION_UNSIGNED) / (totalShares! * program.PRECISION_UNSIGNED);
      }),
    ];

    //stateMachine.setVerboseHeights(24);
    stateMachine.runTransitions(transitions, 'deposit every block to minimize commission', 25);

    const transitions2 = [
      initialize(),
      initialDeposit(2),
      deposit(3, smallDeposit * 23 * MICROCREDITS_TO_CREDITS, user0),
      claimCommission(25, admin, false, (stateMachine) => {
        let totalBalance = stateMachine.arc0038.total_balance.get(BigInt(0));
        let pendingDeposits = stateMachine.arc0038.pending_deposits.get(BigInt(0));
        let fullPool = totalBalance! + pendingDeposits!;
        let totalShares = stateMachine.arc0038.total_shares.get(BigInt(0));
        let adminShares = stateMachine.arc0038.delegator_shares.get(admin)!;
        adminBalanceOneDeposit = (adminShares * fullPool * program.PRECISION_UNSIGNED) / (totalShares! * program.PRECISION_UNSIGNED);
        depositorBalanceOneDeposit = (stateMachine.arc0038.delegator_shares.get(user0)! * fullPool * program.PRECISION_UNSIGNED) / (totalShares! * program.PRECISION_UNSIGNED);
      }),
    ];

    stateMachine = new StateMachine();
    program = stateMachine.arc0038;
    initializeBalances();
    //stateMachine.setVerboseHeights(24);
    stateMachine.runTransitions(transitions2, 'deposit once', 25);

    console.log(`${adminBalanceMultipleDeposits!.toLocaleString()} multiple deposits`);
    console.log(`${adminBalanceOneDeposit!.toLocaleString()} one deposit`);
    console.log(`${(adminBalanceMultipleDeposits! - adminBalanceOneDeposit!).toLocaleString()} delta`);
    console.log('depositor');
    console.log(`${depositorBalanceMultipleDeposits!.toLocaleString()} multiple deposits`);
    console.log(`${depositorBalanceOneDeposit!.toLocaleString()} one deposit`);
    console.log(`${(depositorBalanceMultipleDeposits! - depositorBalanceOneDeposit!).toLocaleString()} delta`);
  });

  it('clearing out program', () => {
    const transtions = [
      initialize(),
      initialDeposit(),
    ];

    stateMachine.setVerboseHeights(0);
    stateMachine.runTransitions(transtions, 'clearing out program', 1);
  });

  it('withdraw batching', () => {
    const transitions = [
      initialize(),
      initialDeposit(),
    ];

    stateMachine.runTransitions(transitions, 'withdraw batching', 10);
  });
});