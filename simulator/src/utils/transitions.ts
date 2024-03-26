import assert from 'assert';

import { blockEvent } from './ARC0038StateMachine';
import { arc_0038Program } from '../contracts/arc_0038';
import { MICROCREDITS_TO_CREDITS, MINIMUM_BOND_POOL } from '../contracts/credits';

export const createInitializeEvent = (arc38: arc_0038Program, commission: number, validator: string, height: bigint = BigInt(1)): blockEvent => {
  const initialDepositRecord = {
    owner: arc38.ADMIN,
    microcredits: MINIMUM_BOND_POOL + BigInt(500 * MICROCREDITS_TO_CREDITS),
  };
  const initializeAction = (program: arc_0038Program) => {
    program.caller = program.ADMIN;
    program.initialize(BigInt(commission), validator);
    const resultRecord = program.initial_deposit(initialDepositRecord, MINIMUM_BOND_POOL, 'test-validator');
    assert(resultRecord.microcredits === BigInt(500 * MICROCREDITS_TO_CREDITS), 'Initial deposit failed');
  };
  const initializeVerify = (program: arc_0038Program) => {
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
  return { height: BigInt(height), action: initializeAction, verify: initializeVerify };
};

export const createSetCommissionPercentEvent = (height: bigint, caller: string, commission: number): blockEvent => {
  const setCommissionEvent: blockEvent = {
    height: height,
    action: (program: arc_0038Program) => {
      console.log('--set_commission_percent--');
      program.caller = caller;
      program.set_commission_percent(BigInt(commission));
    },
    verify: (program: arc_0038Program) => {
      assert(Number(program.commission_percent.get(BigInt(0))) === commission);
    },
  };

  return setCommissionEvent;
};

export const createSetNextValidatorEvent = (height: bigint, caller: string, validator: string): blockEvent => {
  const setValidatorEvent: blockEvent = {
    height: height,
    action: (program: arc_0038Program) => {
      console.log('--set_next_validator--');
      program.caller = caller;
      program.set_next_validator(validator);
    },
    verify: (program: arc_0038Program) => {
      assert(program.validator.get(BigInt(1)) === validator);
    },
  };

  return setValidatorEvent;
};

export const createUnbondAllEvent = (height: bigint, caller: string, amount: bigint): blockEvent => {
  const unbondAllEvent: blockEvent = {
    height: height,
    action: (program: arc_0038Program) => {
      console.log('--unbond_all--');
      program.caller = caller;
      program.unbond_all(amount);
    },
    verify: (program: arc_0038Program) => {
      assert(program.credits.bonded.get(caller) === undefined);
    },
  };

  return unbondAllEvent;
};

export const createClaimUnbondEvent = (height: bigint, caller: string): blockEvent => {
  const claimUnbondEvent: blockEvent = {
    height: height,
    action: (program: arc_0038Program) => {
      console.log('--claim_unbond--');
      program.caller = caller;
      program.claim_unbond();
    },
    verify: (program: arc_0038Program) => {
      assert(program.credits.unbonding.get(caller) === undefined);
    },
  };

  return claimUnbondEvent;
};

export const createBondAllEvent = (height: bigint, caller: string, validator: string, bondAmount: bigint): blockEvent => {
  const bondAllEvent: blockEvent = {
    height: height,
    action: (program: arc_0038Program) => {
      console.log('--bond_all--');
      program.caller = caller;
      program.bond_all(validator, bondAmount);
    },
    verify: (program: arc_0038Program) => {
      // verify
    },
  };

  return bondAllEvent;
};

export const createClaimCommissionEvent = (height: bigint): blockEvent => {
  const claimCommissionEvent: blockEvent = {
    height: height,
    action: (program: arc_0038Program) => {
      console.log('--claim_commission--');
      program.caller = program.ADMIN;
      program.claim_commission();
    },
    verify: (program: arc_0038Program) => {
      assert(program.pending_withdrawal.get(BigInt(0)) === BigInt(0));
    },
  };

  return claimCommissionEvent;
};

export const createDepositEvent = (height: bigint, deposit: bigint, owner: string): blockEvent => {
  const depositRecord = {
    owner: owner,
    microcredits: deposit
  };
  const depositAction = (program: arc_0038Program) => {
    console.log('--deposit--');
    program.caller = 'user0';
    program.deposit_public(depositRecord, deposit);
  };
  const depositVerify = (program: arc_0038Program) => {
  // assert(program.credits.account.get(program.CORE_PROTOCOL) === deposit, 'Account not updated');
  // assert(program.total_balance.get(BigInt(0)) === BigInt(10200 * MICROCREDITS_TO_CREDITS), 'Total balance not set correctly');
  // assert(program.total_shares.get(BigInt(0)) === BigInt(10004948900000 + 99058900000), `Total shares not set correctly: ${program.total_shares.get(BigInt(0))}`);
  // assert(program.delegator_shares.get('user0') === BigInt(99058900000), `User shares not set correctly: ${program.delegator_shares.get('user0')}`);
  // assert(program.delegator_shares.get(program.ADMIN) === BigInt(10004948900000), `Admin shares not set correctly: ${program.delegator_shares.get(program.ADMIN)}`);
  };
  return { height, action: depositAction, verify: depositVerify };
};

export const createWithdrawPublicEvent = (height: bigint, user: string, shares: bigint, microcredits: bigint): blockEvent => {
  const withdrawEvent: blockEvent = {
    height: height,
    action: (program: arc_0038Program) => {
      const sharesToWithdraw = shares > BigInt(0) ? shares : program.delegator_shares.get(user)!;
      console.log('--withdraw--');
      program.caller = user;
      program.withdraw_public(sharesToWithdraw, microcredits);
    },
    verify: (program: arc_0038Program) => {
      assert(program.withdrawals.has(user));
      assert(program.credits.unbonding.has(program.CORE_PROTOCOL));
    },
  };

  return withdrawEvent;
};

export const createCreateWithdrawClaimEvent = (height: bigint, user: string, shares: bigint): blockEvent => {
  const createClaimWithdrawEvent: blockEvent = {
    height: height,
    action: (program: arc_0038Program) => {
      console.log('--create_withdraw_claim--');
      program.caller = user;
      program.create_withdraw_claim(shares);
    },
    verify: (program: arc_0038Program) => {
      assert(program.withdrawals.has(user));
    },
  };

  return createClaimWithdrawEvent;
};
export const createClaimWithdrawPublicEvent = (height: bigint, user: string, amount: bigint): blockEvent => {
  const claimWithdrawEvent: blockEvent = {
    height: height,
    action: (program: arc_0038Program) => {
      console.log('--claim_withdraw_public--');
      program.caller = user;
      program.claim_withdrawal_public(user, amount);
    },
    verify: (program: arc_0038Program) => {

    },
  };

  return claimWithdrawEvent;
};