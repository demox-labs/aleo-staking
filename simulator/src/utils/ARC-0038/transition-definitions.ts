import { MICROCREDITS_TO_CREDITS } from '../../contracts/credits';
import { StateMachine, Transition, TransitionType } from './StateMachine';

export const precision = 1000;
export const admin = 'admin';
export const protocol = 'arc_0038.aleo';
export const testValidator = 'test-validator';
export const user0 = 'user0';
export const user1 = 'user1';
export const user2 = 'user2';
export const user3 = 'user3';
export const user4 = 'user4';

export const initialize = (
  height: number = 1,
  commission: number = 0.05,
  validator: string = testValidator,
  caller: string = admin,
  shouldFail: boolean = false,
  additionalAction?: (stateMachine: StateMachine) => void
): Transition => (
  {
    type: TransitionType.Initialize,
    height: BigInt(height),
    caller,
    commission: BigInt(commission * precision),
    validator,
    shouldFail,
    additionalAction
  });

export const initialDeposit = (
  height: number = 1,
  amount: number = 10000 * MICROCREDITS_TO_CREDITS,
  caller: string = admin,
  validator: string = testValidator,
  shouldFail: boolean = false,
  additionalAction?: (stateMachine: StateMachine) => void
): Transition => (
  {
    height: BigInt(height),
    type: TransitionType.InitialDeposit,
    caller,
    validator,
    amount: BigInt(amount),
    shouldFail,
    additionalAction
  });

export const setCommissionPercent = (
  height: number,
  commission: number,
  caller: string = admin,
  shouldFail: boolean = false,
  additionalAction?: (stateMachine: StateMachine) => void
): Transition => ({
    height: BigInt(height),
    type: TransitionType.SetCommissionPercent,
    caller,
    commission: BigInt(commission * precision),
    shouldFail,
    additionalAction
  });

export const setNextValidator = (
  height: number,
  validator: string,
  caller: string = admin,
  shouldFail: boolean = false,
  additionalAction?: (stateMachine: StateMachine) => void
): Transition => ({
    height: BigInt(height),
    type: TransitionType.SetNextValidator,
    caller,
    validator,
    shouldFail,
    additionalAction
  });

export const unbondAll = (
  height: number,
  caller: string = user0,
  amount: number,
  shouldFail: boolean = false,
  additionalAction?: (stateMachine: StateMachine) => void
): Transition => ({
    height: BigInt(height),
    type: TransitionType.UnbondAll,
    caller,
    amount: BigInt(amount),
    shouldFail,
    additionalAction
  });

export const claimUnbond = (
  height: number,
  caller: string = user0,
  shouldFail: boolean = false,
  additionalAction?: (stateMachine: StateMachine) => void
): Transition => ({
    height: BigInt(height),
    type: TransitionType.ClaimUnbond,
    caller,
    shouldFail,
    additionalAction
  });

export const bondAll = (
  height: number,
  amount: number,
  validator: string = testValidator,
  caller: string = user0,
  shouldFail: boolean = false,
  additionalAction?: (stateMachine: StateMachine) => void
): Transition => ({
    height: BigInt(height),
    type: TransitionType.BondAll,
    caller,
    validator,
    amount: BigInt(amount),
    shouldFail,
    additionalAction
  });

export const bondDeposits = (
  height: number,
  amount: number,
  validator: string = testValidator,
  caller: string = user0,
  shouldFail: boolean = false,
  additionalAction?: (stateMachine: StateMachine) => void
): Transition => ({
    height: BigInt(height),
    type: TransitionType.BondDeposits,
    caller,
    validator,
    amount: BigInt(amount),
    shouldFail,
    additionalAction
  });

export const claimCommission = (
  height: number,
  caller: string = admin,
  shouldFail: boolean = false,
  additionalAction?: (stateMachine: StateMachine) => void
): Transition => ({
    height: BigInt(height),
    type: TransitionType.ClaimCommission,
    caller,
    shouldFail,
    additionalAction
  });

export const deposit = (
  height: number,
  amount: number,
  caller: string,
  shouldFail: boolean = false,
  additionalAction?: (stateMachine: StateMachine) => void
): Transition => ({
    height: BigInt(height),
    type: TransitionType.Deposit,
    caller,
    amount: BigInt(amount),
    shouldFail,
    additionalAction
  });

export const withdrawPublic = (
  height: number,
  caller: string,
  sharesPercent: number,
  withdrawAmount: number,
  shouldFail: boolean = false,
  additionalAction?: (stateMachine: StateMachine) => void
): Transition => ({
    height: BigInt(height),
    type: TransitionType.WithdrawPublic,
    caller,
    sharesPercent,
    amount: BigInt(withdrawAmount),
    shouldFail,
    additionalAction
  });

export const createWithdrawClaim = (
  height: number,
  caller: string,
  sharesPercent: number,
  shouldFail: boolean = false,
  additionalAction?: (stateMachine: StateMachine) => void
): Transition => ({
    height: BigInt(height),
    type: TransitionType.CreateWithdrawClaim,
    caller,
    sharesPercent,
    shouldFail,
    additionalAction
  });

export const claimWithdrawPublic = (
  height: number,
  caller: string,
  amount: number,
  recipient: string,
  shouldFail: boolean = false,
  additionalAction?: (stateMachine: StateMachine) => void
): Transition => ({
    height: BigInt(height),
    type: TransitionType.ClaimWithdrawPublic,
    caller,
    recipient,
    amount: BigInt(amount),
    shouldFail,
    additionalAction
  });