import assert from 'assert';

import { arc_0038Program } from '../src/contracts/arc_0038';
import { MICROCREDITS_TO_CREDITS, MINIMUM_BOND_POOL } from '../src/contracts/credits';
import { ARC0038StateMachine, blockEvent } from '../src/utils/ARC0038StateMachine';
import { createBondAllEvent, createClaimCommissionEvent, createDepositEvent, createInitializeEvent, createSetNextValidatorEvent, createWithdrawPublicEvent } from '../src/utils/transitions';

const jestConsole = console;

describe('ARC0038', () => {
  let stateMachine: ARC0038StateMachine;
  let program: arc_0038Program;

  beforeEach(() => {
    stateMachine = new ARC0038StateMachine();
    program = stateMachine.arc0038;
    global.console = require('console');
  });

  afterEach(() => {
    global.console = jestConsole;
  });

  it('simple test', () => {
    const commission = .05 * Number(program.PRECISION_UNSIGNED);
    const validator = 'test-validator';
    const initializeEvent = createInitializeEvent(program, commission, validator);

    const user = 'user0';
    const deposit = BigInt(50 * MICROCREDITS_TO_CREDITS);
    const depositEvent = createDepositEvent(BigInt(2), deposit, user);

    const bondAllEvent = createBondAllEvent(BigInt(2), user, validator, deposit);

    const claimCommissionEvent = createClaimCommissionEvent(BigInt(4));

    const withdrawShares = BigInt(0);
    const withdrawPublicEvent = createWithdrawPublicEvent(BigInt(5), user, withdrawShares, deposit);

    stateMachine.verbose = true;
    stateMachine.test([initializeEvent, depositEvent, bondAllEvent, claimCommissionEvent, withdrawPublicEvent], 'simple test', 5);
  });

  xit('changing validator', () => {
    const commission = .05 * Number(program.PRECISION_UNSIGNED);
    const validator = 'test-validator';
    const initializeEvent = createInitializeEvent(program, commission, validator);

    const user = 'user0';
    const deposit = BigInt(.1 * MICROCREDITS_TO_CREDITS);
    const depositEvent = createDepositEvent(BigInt(2), deposit, user);

    const bondAllEvent = createBondAllEvent(BigInt(2), user, validator, deposit);

    const newValidator = 'new-validator';
    const setNextValidatorEvent = createSetNextValidatorEvent(BigInt(5), user, newValidator);

    stateMachine.test([initializeEvent, depositEvent, bondAllEvent, setNextValidatorEvent], 'changing validator', 5);
  });
});