import credits.aleo;
import multi_token_support_program_v1.aleo;
import pondo_staked_aleo_token.aleo;
import pondo_token.aleo;
import delegator1.aleo;
import delegator2.aleo;
import delegator3.aleo;
import delegator4.aleo;
import delegator5.aleo;
program pondo_core_protocol.aleo;

struct bond_state:
    validator as address;
    microcredits as u64;


struct TokenMetadata:
    token_id as field;
    name as u128;
    symbol as u128;
    decimals as u8;
    supply as u128;
    max_supply as u128;
    admin as address;
    external_authorization_required as boolean;
    external_authorization_party as address;

struct TokenOwner:
    account as address;
    token_id as field;


struct withdrawal_state:
    microcredits as u64;
    claim_block as u32;


mapping validator_set:
	key as u8.public;
	value as [address; 5u32].public;


mapping balances:
	key as u8.public;
	value as u64.public;


mapping boost_pool:
	key as address.public;
	value as u64.public;


mapping owed_commission:
	key as u8.public;
	value as u64.public;


mapping last_rebalance_epoch:
	key as u8.public;
	value as u32.public;


mapping withdrawn_this_epoch:
	key as u8.public;
	value as u64.public;


mapping withdrawals:
	key as address.public;
	value as withdrawal_state.public;


mapping withdrawal_batches:
	key as u32.public;
	value as u64.public;


function initialize:
    call pondo_staked_aleo_token.aleo/register_token into r0;
    call pondo_token.aleo/initialize_token into r1;
    async initialize r0 r1 into r2;
    output r2 as pondo_core_protocol.aleo/initialize.future;

finalize initialize:
    input r0 as pondo_staked_aleo_token.aleo/register_token.future;
    input r1 as pondo_token.aleo/initialize_token.future;
    await r0;
    await r1;
    set 0u64 into balances[0u8];
    set 0u64 into balances[2u8];
    set 0u64 into balances[3u8];
    set 0u64 into owed_commission[0u8];
    set 0u32 into last_rebalance_epoch[0u8];








function deposit_public_as_signer:
    input r0 as u64.public;
    input r1 as u64.public;
    input r2 as address.public;
    call credits.aleo/transfer_public_as_signer pondo_core_protocol.aleo r0 into r3;
    call pondo_staked_aleo_token.aleo/mint_public r1 self.signer into r4;
    async deposit_public_as_signer r3 r4 r0 r1 r2 into r5;
    output r5 as pondo_core_protocol.aleo/deposit_public_as_signer.future;

finalize deposit_public_as_signer:
    input r0 as credits.aleo/transfer_public_as_signer.future;
    input r1 as pondo_staked_aleo_token.aleo/mint_public.future;
    input r2 as u64.public;
    input r3 as u64.public;
    input r4 as address.public;
    await r0;
    await r1;
    cast pondo_core_protocol.aleo 0u64 into r5 as bond_state;
    get.or_use credits.aleo/bonded[delegator1.aleo] r5 into r6;
    get.or_use credits.aleo/bonded[delegator2.aleo] r5 into r7;
    get.or_use credits.aleo/bonded[delegator3.aleo] r5 into r8;
    get.or_use credits.aleo/bonded[delegator4.aleo] r5 into r9;
    get.or_use credits.aleo/bonded[delegator5.aleo] r5 into r10;
    get.or_use credits.aleo/account[delegator1.aleo] 0u64 into r11;
    get.or_use credits.aleo/account[delegator2.aleo] 0u64 into r12;
    get.or_use credits.aleo/account[delegator3.aleo] 0u64 into r13;
    get.or_use credits.aleo/account[delegator4.aleo] 0u64 into r14;
    get.or_use credits.aleo/account[delegator5.aleo] 0u64 into r15;
    add r6.microcredits r7.microcredits into r16;
    add r16 r8.microcredits into r17;
    add r17 r9.microcredits into r18;
    add r18 r10.microcredits into r19;
    add r11 r12 into r20;
    add r20 r13 into r21;
    add r21 r14 into r22;
    add r22 r15 into r23;
    get.or_use balances[1u8] 0u64 into r24;
    add r19 r23 into r25;
    sub r25 r24 into r26;
    get.or_use balances[0u8] 0u64 into r27;
    get.or_use owed_commission[0u8] 0u64 into r28;
    get multi_token_support_program_v1.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r29;
    cast r28 into r30 as u128;
    add r29.supply r30 into r31;
    gt r26 r27 into r32;
    cast r26 into r33 as i64;
    cast r27 into r34 as i64;
    sub r33 r34 into r35;
    ternary r32 r35 0i64 into r36;
    cast r36 into r37 as u128;
    mul r37 100u128 into r38;
    div r38 1000u128 into r39;
    cast r39 into r40 as u64;
    cast r36 into r41 as u64;
    sub r41 r40 into r42;
    add r27 r42 into r43;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r44;
    get.or_use balances[2u8] 0u64 into r45;
    get.or_use balances[3u8] 0u64 into r46;
    sub r44 r45 into r47;
    sub r47 r46 into r48;
    sub r48 r2 into r49;
    cast r43 into r50 as u128;
    cast r49 into r51 as u128;
    cast r40 into r52 as u128;
    add r50 r51 into r53;
    add r53 r52 into r54;
    mul r31 r54 into r55;
    div r55 r53 into r56;
    sub r56 r31 into r57;
    cast r57 into r58 as u64;
    add r28 r58 into r59;
    set r59 into owed_commission[0u8];
    cast r58 into r60 as u128;
    add r31 r60 into r61;
    add r43 r40 into r62;
    set r62 into balances[0u8];
    cast r62 into r63 as u128;
    cast r49 into r64 as u128;
    cast r2 into r65 as u128;
    add r63 r64 into r66;
    add r66 r65 into r67;
    mul r61 r67 into r68;
    div r68 r66 into r69;
    sub r69 r61 into r70;
    cast r70 into r71 as u64;
    gte r71 1u64 into r72;
    assert.eq r72 true;
    gte r71 r3 into r73;
    assert.eq r73 true;




function deposit_public:
    input r0 as u64.public;
    input r1 as u64.public;
    input r2 as address.public;
    cast r0 into r3 as u128;
    call multi_token_support_program_v1.aleo/transfer_from_public 3443843282313283355522573239085696902919850365217539366784739393210722344986field self.caller pondo_core_protocol.aleo r3 into r4;
    call pondo_staked_aleo_token.aleo/mint_public r1 self.caller into r5;
    async deposit_public r4 r5 r0 r1 r2 into r6;
    output r6 as pondo_core_protocol.aleo/deposit_public.future;

finalize deposit_public:
    input r0 as multi_token_support_program_v1.aleo/transfer_from_public.future;
    input r1 as pondo_staked_aleo_token.aleo/mint_public.future;
    input r2 as u64.public;
    input r3 as u64.public;
    input r4 as address.public;
    await r0;
    await r1;
    cast pondo_core_protocol.aleo 0u64 into r5 as bond_state;
    get.or_use credits.aleo/bonded[delegator1.aleo] r5 into r6;
    get.or_use credits.aleo/bonded[delegator2.aleo] r5 into r7;
    get.or_use credits.aleo/bonded[delegator3.aleo] r5 into r8;
    get.or_use credits.aleo/bonded[delegator4.aleo] r5 into r9;
    get.or_use credits.aleo/bonded[delegator5.aleo] r5 into r10;
    get.or_use credits.aleo/account[delegator1.aleo] 0u64 into r11;
    get.or_use credits.aleo/account[delegator2.aleo] 0u64 into r12;
    get.or_use credits.aleo/account[delegator3.aleo] 0u64 into r13;
    get.or_use credits.aleo/account[delegator4.aleo] 0u64 into r14;
    get.or_use credits.aleo/account[delegator5.aleo] 0u64 into r15;
    add r6.microcredits r7.microcredits into r16;
    add r16 r8.microcredits into r17;
    add r17 r9.microcredits into r18;
    add r18 r10.microcredits into r19;
    add r11 r12 into r20;
    add r20 r13 into r21;
    add r21 r14 into r22;
    add r22 r15 into r23;
    get.or_use balances[1u8] 0u64 into r24;
    add r19 r23 into r25;
    sub r25 r24 into r26;
    get.or_use balances[0u8] 0u64 into r27;
    get.or_use owed_commission[0u8] 0u64 into r28;
    get multi_token_support_program_v1.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r29;
    cast r28 into r30 as u128;
    add r29.supply r30 into r31;
    gt r26 r27 into r32;
    cast r26 into r33 as i64;
    cast r27 into r34 as i64;
    sub r33 r34 into r35;
    ternary r32 r35 0i64 into r36;
    cast r36 into r37 as u128;
    mul r37 100u128 into r38;
    div r38 1000u128 into r39;
    cast r39 into r40 as u64;
    cast r36 into r41 as u64;
    sub r41 r40 into r42;
    add r27 r42 into r43;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r44;
    get.or_use balances[2u8] 0u64 into r45;
    get.or_use balances[3u8] 0u64 into r46;
    sub r44 r45 into r47;
    sub r47 r46 into r48;
    sub r48 r2 into r49;
    cast r43 into r50 as u128;
    cast r49 into r51 as u128;
    cast r40 into r52 as u128;
    add r50 r51 into r53;
    add r53 r52 into r54;
    mul r31 r54 into r55;
    div r55 r53 into r56;
    sub r56 r31 into r57;
    cast r57 into r58 as u64;
    add r28 r58 into r59;
    set r59 into owed_commission[0u8];
    cast r58 into r60 as u128;
    add r31 r60 into r61;
    add r43 r40 into r62;
    set r62 into balances[0u8];
    cast r62 into r63 as u128;
    cast r49 into r64 as u128;
    cast r2 into r65 as u128;
    add r63 r64 into r66;
    add r66 r65 into r67;
    mul r61 r67 into r68;
    div r68 r66 into r69;
    sub r69 r61 into r70;
    cast r70 into r71 as u64;
    gte r71 1u64 into r72;
    assert.eq r72 true;
    gte r71 r3 into r73;
    assert.eq r73 true;




function distribute_deposits:
    input r0 as [address; 5u32].public;
    input r1 as [u64; 5u32].public;
    call credits.aleo/transfer_public delegator1.aleo r1[0u32] into r2;
    call credits.aleo/transfer_public delegator2.aleo r1[1u32] into r3;
    call credits.aleo/transfer_public delegator3.aleo r1[2u32] into r4;
    call credits.aleo/transfer_public delegator4.aleo r1[3u32] into r5;
    call credits.aleo/transfer_public delegator5.aleo r1[4u32] into r6;
    async distribute_deposits r2 r3 r4 r5 r6 r0 r1 into r7;
    output r7 as pondo_core_protocol.aleo/distribute_deposits.future;

finalize distribute_deposits:
    input r0 as credits.aleo/transfer_public.future;
    input r1 as credits.aleo/transfer_public.future;
    input r2 as credits.aleo/transfer_public.future;
    input r3 as credits.aleo/transfer_public.future;
    input r4 as credits.aleo/transfer_public.future;
    input r5 as [address; 5u32].public;
    input r6 as [u64; 5u32].public;
    await r0;
    await r1;
    await r2;
    await r3;
    await r4;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r7;
    get.or_use balances[2u8] 0u64 into r8;
    get.or_use balances[3u8] 0u64 into r9;
    add r8 r9 into r10;
    gte r7 r10 into r11;
    assert.eq r11 true;
    get delegator1.aleo/state_mapping[0u8] into r12;
    get delegator2.aleo/state_mapping[0u8] into r13;
    get delegator3.aleo/state_mapping[0u8] into r14;
    get delegator4.aleo/state_mapping[0u8] into r15;
    get delegator5.aleo/state_mapping[0u8] into r16;
    is.eq r12 1u8 into r17;
    is.eq r13 1u8 into r18;
    and r17 r18 into r19;
    is.eq r14 1u8 into r20;
    and r19 r20 into r21;
    is.eq r15 1u8 into r22;
    and r21 r22 into r23;
    is.eq r16 1u8 into r24;
    and r23 r24 into r25;
    assert.eq r25 true;
    cast pondo_core_protocol.aleo 0u64 into r26 as bond_state;
    get.or_use credits.aleo/bonded[delegator1.aleo] r26 into r27;
    cast r27.microcredits into r28 as u128;
    get.or_use credits.aleo/bonded[delegator2.aleo] r26 into r29;
    cast r29.microcredits into r30 as u128;
    get.or_use credits.aleo/bonded[delegator3.aleo] r26 into r31;
    cast r31.microcredits into r32 as u128;
    get.or_use credits.aleo/bonded[delegator4.aleo] r26 into r33;
    cast r33.microcredits into r34 as u128;
    get.or_use credits.aleo/bonded[delegator5.aleo] r26 into r35;
    cast r35.microcredits into r36 as u128;
    get.or_use credits.aleo/account[delegator1.aleo] 0u64 into r37;
    cast r37 into r38 as u128;
    get.or_use credits.aleo/account[delegator2.aleo] 0u64 into r39;
    cast r39 into r40 as u128;
    get.or_use credits.aleo/account[delegator3.aleo] 0u64 into r41;
    cast r41 into r42 as u128;
    get.or_use credits.aleo/account[delegator4.aleo] 0u64 into r43;
    cast r43 into r44 as u128;
    get.or_use credits.aleo/account[delegator5.aleo] 0u64 into r45;
    cast r45 into r46 as u128;
    add r28 r38 into r47;
    add r30 r40 into r48;
    add r32 r42 into r49;
    add r34 r44 into r50;
    add r36 r46 into r51;
    add r47 r48 into r52;
    add r52 r49 into r53;
    add r53 r50 into r54;
    add r54 r51 into r55;
    mul r47 1000u128 into r56;
    div r56 r55 into r57;
    mul r48 1000u128 into r58;
    div r58 r55 into r59;
    mul r49 1000u128 into r60;
    div r60 r55 into r61;
    mul r50 1000u128 into r62;
    div r62 r55 into r63;
    mul r51 1000u128 into r64;
    div r64 r55 into r65;
    is.eq r57 400u128 into r66;
    is.eq r59 250u128 into r67;
    and r66 r67 into r68;
    is.eq r61 160u128 into r69;
    and r68 r69 into r70;
    is.eq r63 110u128 into r71;
    and r70 r71 into r72;
    is.eq r65 80u128 into r73;
    and r72 r73 into r74;
    assert.eq r74 true;






function withdraw_public:
    input r0 as u64.public;
    call pondo_staked_aleo_token.aleo/burn_public r0 self.caller into r1;
    cast r0 into r2 as u128;
    mul r2 30u128 into r3;
    div r3 1000u128 into r4;
    cast r4 into r5 as u64;
    call pondo_staked_aleo_token.aleo/mint_public r5 pondo_token.aleo into r6;
    sub r0 r5 into r7;
    async withdraw_public r1 r6 r7 self.caller into r8;
    output r8 as pondo_core_protocol.aleo/withdraw_public.future;

finalize withdraw_public:
    input r0 as pondo_staked_aleo_token.aleo/burn_public.future;
    input r1 as pondo_staked_aleo_token.aleo/mint_public.future;
    input r2 as u64.public;
    input r3 as address.public;
    await r0;
    await r1;
    contains validator_set[1u8] into r4;
    not r4 into r5;
    assert.eq r5 true;
    contains withdrawals[r3] into r6;
    not r6 into r7;
    assert.eq r7 true;
    cast pondo_core_protocol.aleo 0u64 into r8 as bond_state;
    get.or_use credits.aleo/bonded[delegator1.aleo] r8 into r9;
    get.or_use credits.aleo/bonded[delegator2.aleo] r8 into r10;
    get.or_use credits.aleo/bonded[delegator3.aleo] r8 into r11;
    get.or_use credits.aleo/bonded[delegator4.aleo] r8 into r12;
    get.or_use credits.aleo/bonded[delegator5.aleo] r8 into r13;
    get.or_use credits.aleo/account[delegator1.aleo] 0u64 into r14;
    get.or_use credits.aleo/account[delegator2.aleo] 0u64 into r15;
    get.or_use credits.aleo/account[delegator3.aleo] 0u64 into r16;
    get.or_use credits.aleo/account[delegator4.aleo] 0u64 into r17;
    get.or_use credits.aleo/account[delegator5.aleo] 0u64 into r18;
    add r9.microcredits r10.microcredits into r19;
    add r19 r11.microcredits into r20;
    add r20 r12.microcredits into r21;
    add r21 r13.microcredits into r22;
    add r14 r15 into r23;
    add r23 r16 into r24;
    add r24 r17 into r25;
    add r25 r18 into r26;
    get.or_use balances[1u8] 0u64 into r27;
    add r22 r26 into r28;
    sub r28 r27 into r29;
    get.or_use balances[0u8] 0u64 into r30;
    get.or_use owed_commission[0u8] 0u64 into r31;
    get multi_token_support_program_v1.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r32;
    cast r31 into r33 as u128;
    add r32.supply r33 into r34;
    cast r2 into r35 as u128;
    add r34 r35 into r36;
    gt r29 r30 into r37;
    cast r29 into r38 as i64;
    cast r30 into r39 as i64;
    sub r38 r39 into r40;
    ternary r37 r40 0i64 into r41;
    cast r41 into r42 as u128;
    mul r42 100u128 into r43;
    div r43 1000u128 into r44;
    cast r44 into r45 as u64;
    cast r41 into r46 as u64;
    sub r46 r45 into r47;
    add r30 r47 into r48;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r49;
    get.or_use balances[2u8] 0u64 into r50;
    get.or_use balances[3u8] 0u64 into r51;
    sub r49 r50 into r52;
    sub r52 r51 into r53;
    cast r48 into r54 as u128;
    cast r53 into r55 as u128;
    cast r45 into r56 as u128;
    add r54 r55 into r57;
    add r57 r56 into r58;
    mul r36 r58 into r59;
    div r59 r57 into r60;
    sub r60 r36 into r61;
    cast r61 into r62 as u64;
    add r31 r62 into r63;
    set r63 into owed_commission[0u8];
    cast r62 into r64 as u128;
    add r36 r64 into r65;
    add r48 r45 into r66;
    cast r66 into r67 as u128;
    cast r53 into r68 as u128;
    add r67 r68 into r69;
    cast r2 into r70 as u128;
    cast r69 into r71 as u128;
    mul r70 r71 into r72;
    cast r65 into r73 as u128;
    div r72 r73 into r74;
    cast r74 into r75 as u64;
    add r27 r75 into r76;
    set r76 into balances[1u8];
    sub r66 r75 into r77;
    set r77 into balances[0u8];
    add block.height 43_200u32 into r78;
    div r78 120_960u32 into r79;
    add r79 1u32 into r80;
    mul r80 120_960u32 into r81;
    add r81 17_280u32 into r82;
    add r82 1u32 into r83;
    cast r75 r83 into r84 as withdrawal_state;
    set r84 into withdrawals[r3];
    get.or_use withdrawal_batches[r79] 0u64 into r85;
    add r85 r75 into r86;
    set r86 into withdrawal_batches[r79];




function claim_withdrawal_public:
    input r0 as address.public;
    input r1 as u64.public;
    call credits.aleo/transfer_public r0 r1 into r2;
    async claim_withdrawal_public r2 r0 r1 into r3;
    output r3 as pondo_core_protocol.aleo/claim_withdrawal_public.future;

finalize claim_withdrawal_public:
    input r0 as credits.aleo/transfer_public.future;
    input r1 as address.public;
    input r2 as u64.public;
    await r0;
    get withdrawals[r1] into r3;
    lt r3.claim_block block.height into r4;
    assert.eq r4 true;
    get.or_use withdrawn_this_epoch[0u8] 0u64 into r5;
    add r5 r2 into r6;
    lte r6 125_000_000u64 into r7;
    assert.eq r7 true;
    is.eq r3.microcredits r2 into r8;
    branch.eq r8 false to end_then_0_0;
    remove withdrawals[r1];
    branch.eq true true to end_otherwise_0_1;
    position end_then_0_0;
    sub r3.microcredits r2 into r9;
    cast r9 r3.claim_block into r10 as withdrawal_state;
    set r10 into withdrawals[r1];
    position end_otherwise_0_1;
    add r5 r2 into r11;
    set r11 into withdrawn_this_epoch[0u8];
    get.or_use balances[3u8] 0u64 into r12;
    sub r12 r2 into r13;
    set r13 into balances[3u8];




function boost_public_as_signer:
    input r0 as u64.public;
    input r1 as address.public;
    gte r0 5_000_000u64 into r2;
    assert.eq r2 true;
    call credits.aleo/transfer_public_as_signer pondo_core_protocol.aleo r0 into r3;
    async boost_public_as_signer r3 r0 r1 into r4;
    output r4 as pondo_core_protocol.aleo/boost_public_as_signer.future;

finalize boost_public_as_signer:
    input r0 as credits.aleo/transfer_public_as_signer.future;
    input r1 as u64.public;
    input r2 as address.public;
    await r0;
    get.or_use boost_pool[r2] 0u64 into r3;
    add r3 r1 into r4;
    set r4 into boost_pool[r2];
    get.or_use balances[2u8] 0u64 into r5;
    add r5 r1 into r6;
    set r6 into balances[2u8];




function boost_public:
    input r0 as u64.public;
    input r1 as address.public;
    cast r0 into r2 as u128;
    call multi_token_support_program_v1.aleo/transfer_from_public 3443843282313283355522573239085696902919850365217539366784739393210722344986field self.caller pondo_core_protocol.aleo r2 into r3;
    call multi_token_support_program_v1.aleo/withdraw_credits_public r0 into r4;
    async boost_public r3 r4 r0 r1 into r5;
    output r5 as pondo_core_protocol.aleo/boost_public.future;

finalize boost_public:
    input r0 as multi_token_support_program_v1.aleo/transfer_from_public.future;
    input r1 as multi_token_support_program_v1.aleo/withdraw_credits_public.future;
    input r2 as u64.public;
    input r3 as address.public;
    await r0;
    await r1;
    get.or_use boost_pool[r3] 0u64 into r4;
    add r4 r2 into r5;
    set r5 into boost_pool[r3];
    get.or_use balances[2u8] 0u64 into r6;
    add r6 r2 into r7;
    set r7 into balances[2u8];




function prep_rebalance:
    call delegator1.aleo/set_state 2u8 into r0;
    call delegator2.aleo/set_state 2u8 into r1;
    call delegator3.aleo/set_state 2u8 into r2;
    call delegator4.aleo/set_state 2u8 into r3;
    call delegator5.aleo/set_state 2u8 into r4;
    async prep_rebalance r0 r1 r2 r3 r4 into r5;
    output r5 as pondo_core_protocol.aleo/prep_rebalance.future;

finalize prep_rebalance:
    input r0 as delegator1.aleo/set_state.future;
    input r1 as delegator2.aleo/set_state.future;
    input r2 as delegator3.aleo/set_state.future;
    input r3 as delegator4.aleo/set_state.future;
    input r4 as delegator5.aleo/set_state.future;
    await r0;
    await r1;
    await r2;
    await r3;
    await r4;
    div block.height 120_960u32 into r5;
    get.or_use last_rebalance_epoch[0u8] 0u32 into r6;
    gt r5 r6 into r7;
    assert.eq r7 true;
    rem block.height 120_960u32 into r8;
    lt r8 17_280u32 into r9;
    assert.eq r9 true;




function rebalance_retrieve_credits:
    input r0 as [u64; 5u32].public;
    input r1 as u64.public;
    call delegator1.aleo/transfer_to_core_protocol r0[0u32] into r2;
    call delegator2.aleo/transfer_to_core_protocol r0[1u32] into r3;
    call delegator3.aleo/transfer_to_core_protocol r0[2u32] into r4;
    call delegator4.aleo/transfer_to_core_protocol r0[3u32] into r5;
    call delegator5.aleo/transfer_to_core_protocol r0[4u32] into r6;
    call pondo_staked_aleo_token.aleo/mint_public r1 pondo_token.aleo into r7;
    async rebalance_retrieve_credits r2 r3 r4 r5 r6 r7 r1 into r8;
    output r8 as pondo_core_protocol.aleo/rebalance_retrieve_credits.future;

finalize rebalance_retrieve_credits:
    input r0 as delegator1.aleo/transfer_to_core_protocol.future;
    input r1 as delegator2.aleo/transfer_to_core_protocol.future;
    input r2 as delegator3.aleo/transfer_to_core_protocol.future;
    input r3 as delegator4.aleo/transfer_to_core_protocol.future;
    input r4 as delegator5.aleo/transfer_to_core_protocol.future;
    input r5 as pondo_staked_aleo_token.aleo/mint_public.future;
    input r6 as u64.public;
    await r0;
    await r1;
    await r2;
    await r3;
    await r4;
    await r5;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r7;
    get.or_use balances[2u8] 0u64 into r8;
    get.or_use balances[3u8] 0u64 into r9;
    get.or_use balances[1u8] 0u64 into r10;
    sub r7 r8 into r11;
    sub r11 r9 into r12;
    sub r12 r10 into r13;
    get.or_use balances[0u8] 0u64 into r14;
    get.or_use owed_commission[0u8] 0u64 into r15;
    get multi_token_support_program_v1.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r16;
    cast r15 into r17 as u128;
    add r16.supply r17 into r18;
    cast r6 into r19 as u128;
    sub r18 r19 into r20;
    gt r13 r14 into r21;
    cast r13 into r22 as i64;
    cast r14 into r23 as i64;
    sub r22 r23 into r24;
    ternary r21 r24 0i64 into r25;
    cast r25 into r26 as u128;
    mul r26 100u128 into r27;
    div r27 1000u128 into r28;
    cast r28 into r29 as u64;
    cast r25 into r30 as u64;
    sub r30 r29 into r31;
    add r14 r31 into r32;
    cast r32 into r33 as u128;
    cast r29 into r34 as u128;
    add r33 0u128 into r35;
    add r35 r34 into r36;
    mul r20 r36 into r37;
    div r37 r35 into r38;
    sub r38 r20 into r39;
    cast r39 into r40 as u64;
    add r15 r40 into r41;
    sub r41 r6 into r42;
    set r42 into owed_commission[0u8];
    add r32 r29 into r43;
    set r43 into balances[0u8];
    div block.height 120_960u32 into r44;
    sub r44 1u32 into r45;
    get.or_use withdrawal_batches[r45] 0u64 into r46;
    add r9 r46 into r47;
    set r47 into balances[3u8];
    sub r10 r46 into r48;
    set r48 into balances[1u8];




function rebalance_redistribute:
    input r0 as [address; 5u32].public;
    input r1 as [u64; 5u32].public;
    call credits.aleo/transfer_public delegator1.aleo r1[0u32] into r2;
    call credits.aleo/transfer_public delegator2.aleo r1[1u32] into r3;
    call credits.aleo/transfer_public delegator3.aleo r1[2u32] into r4;
    call credits.aleo/transfer_public delegator4.aleo r1[3u32] into r5;
    call credits.aleo/transfer_public delegator5.aleo r1[4u32] into r6;
    call delegator1.aleo/set_validator r0[0u32] into r7;
    call delegator2.aleo/set_validator r0[1u32] into r8;
    call delegator3.aleo/set_validator r0[2u32] into r9;
    call delegator4.aleo/set_validator r0[3u32] into r10;
    call delegator5.aleo/set_validator r0[4u32] into r11;
    async rebalance_redistribute r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r0 r1 into r12;
    output r12 as pondo_core_protocol.aleo/rebalance_redistribute.future;

finalize rebalance_redistribute:
    input r0 as credits.aleo/transfer_public.future;
    input r1 as credits.aleo/transfer_public.future;
    input r2 as credits.aleo/transfer_public.future;
    input r3 as credits.aleo/transfer_public.future;
    input r4 as credits.aleo/transfer_public.future;
    input r5 as delegator1.aleo/set_validator.future;
    input r6 as delegator2.aleo/set_validator.future;
    input r7 as delegator3.aleo/set_validator.future;
    input r8 as delegator4.aleo/set_validator.future;
    input r9 as delegator5.aleo/set_validator.future;
    input r10 as [address; 5u32].public;
    input r11 as [u64; 5u32].public;
    await r0;
    await r1;
    await r2;
    await r3;
    await r4;
    await r5;
    await r6;
    await r7;
    await r8;
    await r9;
    set 0u64 into balances[2u8];
    get validator_set[1u8] into r12;
    set r12 into validator_set[0u8];
    remove validator_set[1u8];
    is.eq r10[0u32] r12[0u32] into r13;
    assert.eq r13 true;
    is.eq r10[1u32] r12[1u32] into r14;
    assert.eq r14 true;
    is.eq r10[2u32] r12[2u32] into r15;
    assert.eq r15 true;
    is.eq r10[3u32] r12[3u32] into r16;
    assert.eq r16 true;
    is.eq r10[4u32] r12[4u32] into r17;
    assert.eq r17 true;
    add r11[0u32] r11[1u32] into r18;
    add r18 r11[2u32] into r19;
    add r19 r11[3u32] into r20;
    add r20 r11[4u32] into r21;
    cast r21 into r22 as u128;
    cast r11[0u32] into r23 as u128;
    mul r23 1000u128 into r24;
    div r24 r22 into r25;
    cast r11[1u32] into r26 as u128;
    mul r26 1000u128 into r27;
    div r27 r22 into r28;
    cast r11[2u32] into r29 as u128;
    mul r29 1000u128 into r30;
    div r30 r22 into r31;
    cast r11[3u32] into r32 as u128;
    mul r32 1000u128 into r33;
    div r33 r22 into r34;
    cast r11[4u32] into r35 as u128;
    mul r35 1000u128 into r36;
    div r36 r22 into r37;
    is.eq r25 400u128 into r38;
    assert.eq r38 true;
    is.eq r28 250u128 into r39;
    assert.eq r39 true;
    is.eq r31 160u128 into r40;
    assert.eq r40 true;
    is.eq r34 110u128 into r41;
    assert.eq r41 true;
    is.eq r37 80u128 into r42;
    assert.eq r42 true;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r43;
    get.or_use balances[3u8] 0u64 into r44;
    gte r43 r44 into r45;
    assert.eq r45 true;
    div block.height 120_960u32 into r46;
    set r46 into last_rebalance_epoch[0u8];

