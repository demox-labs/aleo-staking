import credits.aleo;
program delegator5.aleo;

struct committee_state:
    is_open as boolean;
    commission as u8;



mapping state_mapping:
	key as u8.public;
	value as u8.public;


mapping validator_mapping:
	key as u8.public;
	value as address.public;


mapping banned_validators:
	key as address.public;
	value as boolean.public;


function set_state:
    input r0 as u8.public;
    assert.eq self.caller pondo_core_protocol.aleo;
    is.eq r0 0u8 into r1;
    is.eq r0 2u8 into r2;
    or r1 r2 into r3;
    assert.eq r3 true;
    async set_state r0 into r4;
    output r4 as delegator5.aleo/set_state.future;

finalize set_state:
    input r0 as u8.public;
    get state_mapping[0u8] into r1;
    is.eq r1 1u8 into r2;
    branch.eq r2 false to end_then_0_0;
    is.eq r0 2u8 into r3;
    assert.eq r3 true;
    branch.eq true true to end_otherwise_0_1;
    position end_then_0_0;
    position end_otherwise_0_1;
    is.eq r1 4u8 into r4;
    branch.eq r4 false to end_then_0_2;
    is.eq r0 0u8 into r5;
    assert.eq r5 true;
    branch.eq true true to end_otherwise_0_3;
    position end_then_0_2;
    position end_otherwise_0_3;
    set r0 into state_mapping[0u8];




function set_validator:
    input r0 as address.public;
    assert.eq self.caller pondo_core_protocol.aleo;
    async set_validator r0 into r1;
    output r1 as delegator5.aleo/set_validator.future;

finalize set_validator:
    input r0 as address.public;
    set r0 into validator_mapping[0u8];
    get state_mapping[0u8] into r1;
    is.eq r1 0u8 into r2;
    assert.eq r2 true;




function bond:
    input r0 as address.public;
    input r1 as u64.public;
    call credits.aleo/bond_public r0 delegator5.aleo r1 into r2;
    async bond r0 r2 into r3;
    output r3 as delegator5.aleo/bond.future;

finalize bond:
    input r0 as address.public;
    input r1 as credits.aleo/bond_public.future;
    await r1;
    get validator_mapping[0u8] into r2;
    assert.eq r0 r2;
    get credits.aleo/account[delegator5.aleo] into r3;
    assert.eq r3 0u64;
    get state_mapping[0u8] into r4;
    is.eq r4 0u8 into r5;
    is.eq r4 1u8 into r6;
    or r5 r6 into r7;
    assert.eq r7 true;
    set 1u8 into state_mapping[0u8];




function unbond:
    input r0 as u64.public;
    call credits.aleo/unbond_public delegator5.aleo r0 into r1;
    async unbond r1 into r2;
    output r2 as delegator5.aleo/unbond.future;

finalize unbond:
    input r0 as credits.aleo/unbond_public.future;
    await r0;
    contains credits.aleo/bonded[delegator5.aleo] into r1;
    assert.eq r1 false;
    get state_mapping[0u8] into r2;
    assert.eq r2 3u8;
    set 3u8 into state_mapping[0u8];




function terminal_state:
    async terminal_state into r0;
    output r0 as delegator5.aleo/terminal_state.future;

finalize terminal_state:
    contains credits.aleo/bonded[delegator5.aleo] into r0;
    assert.eq r0 false;
    contains credits.aleo/unbonding[delegator5.aleo] into r1;
    assert.eq r1 false;
    get state_mapping[0u8] into r2;
    is.neq r2 0u8 into r3;
    assert.eq r3 true;
    is.eq r2 1u8 into r4;
    branch.eq r4 false to end_then_0_4;
    get validator_mapping[0u8] into r5;
    set true into banned_validators[r5];
    branch.eq true true to end_otherwise_0_5;
    position end_then_0_4;
    position end_otherwise_0_5;
    set 4u8 into state_mapping[0u8];




function transfer_to_core_protocol:
    input r0 as u64.public;
    assert.eq self.caller pondo_core_protocol.aleo;
    call credits.aleo/transfer_public pondo_core_protocol.aleo r0 into r1;
    async transfer_to_core_protocol r1 into r2;
    output r2 as delegator5.aleo/transfer_to_core_protocol.future;

finalize transfer_to_core_protocol:
    input r0 as credits.aleo/transfer_public.future;
    await r0;
    get credits.aleo/account[delegator5.aleo] into r1;
    assert.eq r1 0u64;
    get state_mapping[0u8] into r2;
    assert.eq r2 4u8;




function bond_failed:
    async bond_failed into r0;
    output r0 as delegator5.aleo/bond_failed.future;

finalize bond_failed:
    contains credits.aleo/bonded[delegator5.aleo] into r0;
    assert.eq r0 false;
    contains credits.aleo/unbonding[delegator5.aleo] into r1;
    assert.eq r1 false;
    get validator_mapping[0u8] into r2;
    get credits.aleo/committee[r2] into r3;
    is.eq r3.is_open false into r4;
    assert.eq r4 true;
    get state_mapping[0u8] into r5;
    is.eq r5 0u8 into r6;
    assert.eq r6 true;
    set 4u8 into state_mapping[0u8];
    set true into banned_validators[r2];




function insufficient_balance:
    async insufficient_balance into r0;
    output r0 as delegator5.aleo/insufficient_balance.future;

finalize insufficient_balance:
    contains credits.aleo/bonded[delegator5.aleo] into r0;
    assert.eq r0 false;
    contains credits.aleo/unbonding[delegator5.aleo] into r1;
    assert.eq r1 false;
    get credits.aleo/account[delegator5.aleo] into r2;
    lt r2 10_000_000_000u64 into r3;
    assert.eq r3 true;
    get state_mapping[0u8] into r4;
    is.eq r4 0u8 into r5;
    assert.eq r5 true;
    set 4u8 into state_mapping[0u8];

