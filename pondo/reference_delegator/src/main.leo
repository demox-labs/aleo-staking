import credits.aleo;
import pondo_oracle.aleo;

program reference_delegator.aleo {
  // The address of the person who controls this program
  const ADMIN: address = aleo1j0zju7f0fpgv98gulyywtkxk6jca99l6425uqhnd5kccu4jc2grstjx0mt;
  // The address of the validator who will be delegated to
  const VALIDATOR: address = aleo1j0zju7f0fpgv98gulyywtkxk6jca99l6425uqhnd5kccu4jc2grstjx0mt;
  // The minimum delegation set by the credits.aleo program
  const MIN_DELEGATION: u64 = 10_000_000_000u64;

  // A mapping to set a bit that the program has been initialized
  mapping initialized: u8 => u8;

  async transition initialize() -> Future {
    // Ensure the admin is calling
    assert_eq(self.caller, ADMIN);

    // Transfer 10K credits to the program
    let f0: Future = credits.aleo/transfer_public_as_signer(reference_delegator.aleo, MIN_DELEGATION);

    // Delegate those 10K credits to a validator
    let f1: Future = credits.aleo/bond_public(VALIDATOR, reference_delegator.aleo, MIN_DELEGATION);

    // Register the reference delegation with the pondo oracle
    let f2: Future = pondo_oracle.aleo/propose_reference_delegator(VALIDATOR);

    return initialize_delegator(f0, f1, f2);
  }

  async function initialize_delegator(
    f0: Future,
    f1: Future,
    f2: Future
  ) {
    // Await all of the cross program invocations
    f0.await(); // transfer_public_as_signer to this program
    f1.await(); // bond_public to the specified validator
    f2.await(); // propose_reference_delegator

    // Ensure this program can only be initialized one time
    let is_initialized: bool = Mapping::contains(initialized, 0u8);
    assert_eq(is_initialized, false);

    // Set to 8 as 8 is lucky
    Mapping::set(initialized, 0u8, 8u8);
  }

  // In order to successfully call remove, the amount input must be enough to fully unbond the delegator
  // credits.aleo/bonded[reference_delegator.aleo].microcredits - 10K credits < amount <= credits.aleo/bonded[reference_delegator.aleo].microcredits
  async transition remove(
    public amount: u64
  ) -> Future {
    // Ensure the admin is calling
    assert_eq(self.caller, ADMIN);

    // Unbond_public
    // TODO Fix to ARC-41 as soon as that update is pushed to leo
    // let f0: Future = credits.aleo/unbond_public(reference_delegator.aleo, amount);
    let f0: Future = credits.aleo/unbond_public(amount);

    // Remove the reference delegator
    let f1: Future = pondo_oracle.aleo/remove_reference_delegator();

    return remove_delegator(f0, f1);
  }

  async function remove_delegator(
    f0: Future,
    f1: Future
  ) {
    // Await all of the cross program invocations
    f0.await(); // unbond_public
    f1.await(); // remove_reference_delegator

    // Assert that the delegator is fully unbonded
    let still_bonded: bool = credits.aleo/bonded.contains(reference_delegator.aleo);
    assert_eq(still_bonded, false);
  }

  // In order to call this, someone has to call credits.aleo/claim_unbond_public
  // As it is a permissionless call, anyone can call it first
  async transition withdraw(
    amount: u64
  ) -> Future {
    // Transfer all of the balance to the admin
    let f0: Future = credits.aleo/transfer_public(ADMIN, amount);

    return withdraw_balance(f0);
  }

  async function withdraw_balance(
    f0: Future
  ) {
    // Await the transfer_public
    f0.await();

    // Ensure there's not remaining balance
    let balance: u64 = credits.aleo/account.get_or_use(reference_delegator.aleo, 0u64);
    assert_eq(balance, 0u64);
  }
}
