import assert from 'assert';

import { blockEvent } from './StateMachine';
import { arc_0038Program } from '../../contracts/arc_0038';
import { MICROCREDITS_TO_CREDITS, MINIMUM_BOND_POOL } from '../../contracts/credits';

export const createInitializeEvent = (commission: number, validator: string, height: bigint = BigInt(1)): blockEvent => {
  const initializeAction = (program: arc_0038Program) => {
    program.caller = program.ADMIN;
    program.initialize(BigInt(commission), validator);
    program.initial_deposit(MINIMUM_BOND_POOL, 'test-validator');

    // initialize
    assert(program.is_initialized.get(BigInt(0)));
    assert(Number(program.commission_percent.get(BigInt(0))) === commission);
    assert(program.validator.get(BigInt(0)) === validator);
    assert(program.pending_withdrawal.get(BigInt(0)) === BigInt(0));
    assert(program.pending_withdrawal.get(BigInt(1)) === BigInt(0));
    assert(program.current_batch_height.get(BigInt(0)) === BigInt(0));
    // initial_deposit
    assert(program.credits.bonded.has(program.CORE_PROTOCOL), 'Bonded state not set');
    assert(program.credits.bonded.get(program.CORE_PROTOCOL)!.microcredits === MINIMUM_BOND_POOL, 'Bonded state not set correctly');
    assert(program.total_balance.get(BigInt(0)) === MINIMUM_BOND_POOL, 'Total balance not set correctly');
    assert(program.total_shares.get(BigInt(0)) === MINIMUM_BOND_POOL * program.SHARES_TO_MICROCREDITS, 'Total shares not set correctly');
    assert(program.delegator_shares.get(program.ADMIN) === MINIMUM_BOND_POOL * program.SHARES_TO_MICROCREDITS, 'Admin shares not set correctly');
  };

  return { height: BigInt(height), act: initializeAction };
};

export const createSetCommissionPercentEvent = (height: bigint, caller: string, commission: number): blockEvent => {
  const setCommissionEvent: blockEvent = {
    height: height,
    act: (program: arc_0038Program) => {
      console.log('--set_commission_percent--');
      program.caller = caller;
      program.set_commission_percent(BigInt(commission));

      assert(Number(program.commission_percent.get(BigInt(0))) === commission);
    }
  };

  return setCommissionEvent;
};

export const createSetNextValidatorEvent = (height: bigint, caller: string, validator: string): blockEvent => {
  const setValidatorEvent: blockEvent = {
    height: height,
    act: (program: arc_0038Program) => {
      console.log('--set_next_validator--');
      program.caller = caller;
      program.set_next_validator(validator);

      assert(program.validator.get(BigInt(1)) === validator);
    }
  };

  return setValidatorEvent;
};

export const createUnbondAllEvent = (height: bigint, caller: string, amount: bigint): blockEvent => {
  const unbondAllEvent: blockEvent = {
    height: height,
    act: (program: arc_0038Program) => {
      console.log('--unbond_all--');
      program.caller = caller;
      program.unbond_all(amount);

      assert(program.credits.bonded.get(caller) === undefined);
    }
  };

  return unbondAllEvent;
};

export const createClaimUnbondEvent = (height: bigint, caller: string): blockEvent => {
  const claimUnbondEvent: blockEvent = {
    height: height,
    act: (program: arc_0038Program) => {
      console.log('--claim_unbond--');
      program.caller = caller;
      program.claim_unbond();

      assert(program.credits.unbonding.get(caller) === undefined);
    }
  };

  return claimUnbondEvent;
};

export const createBondAllEvent = (height: bigint, caller: string, validator: string, bondAmount: bigint, expectedBalance: bigint): blockEvent => {
  const bondAllEvent: blockEvent = {
    height: height,
    act: (program: arc_0038Program) => {
      console.log('--bond_all--');
      program.caller = caller;
      program.bond_all(validator, bondAmount);
    }
  };

  return bondAllEvent;
};

export const createBondDepositsEvent = (height: bigint, caller: string, validator: string, bondAmount: bigint, doAssert: boolean, expectedBalance?: bigint): blockEvent => {
  const bondDepositsEvent: blockEvent = {
    height: height,
    act: (program: arc_0038Program) => {
      console.log('--bond_deposits--');
      program.caller = caller;
      program.bond_deposits(validator, bondAmount);

      if (!doAssert) return;
    }
  };

  return bondDepositsEvent;
};

export const createClaimCommissionEvent = (height: bigint, doAssert: boolean, expectedCommission?: bigint, expectedBalance?: bigint, expectedPendingDeposits?: bigint): blockEvent => {
  const claimCommissionEvent: blockEvent = {
    height: height,
    act: (program: arc_0038Program) => {
      console.log('--claim_commission--');
      program.caller = program.ADMIN;
      program.claim_commission();

      if (!doAssert) return;
      assert(program.delegator_shares.get(program.ADMIN) === expectedCommission, `Admin shares not set correctly: ${program.delegator_shares.get(program.ADMIN)!.toLocaleString()}`);
      assert(program.total_balance.get(BigInt(0)) === expectedBalance, 'Total balance not set correctly');
      assert(program.pending_deposits.get(BigInt(0)) === expectedPendingDeposits, 'Pending deposits not set correctly');
    }
  };

  return claimCommissionEvent;
};

export const createDepositEvent = (height: bigint, deposit: bigint, owner: string, doAssert: boolean, expectedShares?: bigint, expectedCommission?: bigint, expectedBalance?: bigint): blockEvent => {
  const depositAction = (program: arc_0038Program) => {
    console.log('--deposit--');
    const balance = program.credits.account.get(owner) || BigInt(0);
    program.credits.account.set(owner, balance + deposit);
    program.caller = owner;
    program.deposit_public(deposit);

    if (!doAssert) return;
    assert(program.total_balance.get(BigInt(0)) === expectedBalance, 'Total balance not set correctly');
    assert(program.delegator_shares.get('user0') === expectedShares, `User shares not set correctly: ${program.delegator_shares.get('user0')!.toLocaleString()}`);
    assert(program.delegator_shares.get(program.ADMIN) === expectedCommission,
    `Admin shares not set correctly: expected ${expectedCommission?.toLocaleString()} actual ${program.delegator_shares.get(program.ADMIN)!.toLocaleString()}`);
  };

  return { height, act: depositAction };
};

export const createWithdrawPublicEvent = (height: bigint, user: string, shares: bigint, microcredits: bigint, doAssert: boolean, expectedCommission?: bigint): blockEvent => {
  const withdrawEvent: blockEvent = {
    height: height,
    act: (program: arc_0038Program) => {
      const sharesToWithdraw = shares > BigInt(0) ? shares : program.delegator_shares.get(user)!;
      console.log('--withdraw--');
      program.caller = user;
      program.withdraw_public(sharesToWithdraw, microcredits);

      if (!doAssert) return;
      assert(program.withdrawals.has(user));
      assert(program.credits.unbonding.has(program.CORE_PROTOCOL));
      const unbonding = program.credits.unbonding.get(program.CORE_PROTOCOL)!;
      assert(unbonding.microcredits === microcredits);
      assert(unbonding.height <= program.current_batch_height.get(BigInt(0))!);
      assert(program.delegator_shares.get(program.ADMIN) === expectedCommission,
        `Admin shares not set correctly: expected ${expectedCommission?.toLocaleString()} actual ${program.delegator_shares.get(program.ADMIN)!.toLocaleString()}`);
    }
  };

  return withdrawEvent;
};

export const createCreateWithdrawClaimEvent = (height: bigint, user: string, shares: bigint): blockEvent => {
  const createClaimWithdrawEvent: blockEvent = {
    height: height,
    act: (program: arc_0038Program) => {
      console.log('--create_withdraw_claim--');
      program.caller = user;
      program.create_withdraw_claim(shares);

      assert(program.withdrawals.has(user));
    }
  };

  return createClaimWithdrawEvent;
};

export const createClaimWithdrawPublicEvent = (height: bigint, user: string, amount: bigint): blockEvent => {
  const claimWithdrawEvent: blockEvent = {
    height: height,
    act: (program: arc_0038Program) => {
      console.log('--claim_withdraw_public--');
      program.caller = user;
      program.claim_withdrawal_public(user, amount);
    }
  };

  return claimWithdrawEvent;
};