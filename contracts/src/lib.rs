#![no_std]
use soroban_sdk::{contract, contractimpl, token, Address, Env, Map, Symbol, symbol_short};

const ORACLE: Symbol = symbol_short!("ORACLE");
const TOKEN: Symbol = symbol_short!("TOKEN");
const PAID: Symbol = symbol_short!("PAID");

fn get_paid(env: &Env) -> Map<u64, bool> {
    env.storage().instance().get(&PAID).unwrap_or(Map::new(env))
}

#[contract]
pub struct WaveVault;

#[contractimpl]
impl WaveVault {
    pub fn initialize(env: Env, oracle: Address, token: Address) {
        if env.storage().instance().has(&ORACLE) {
            panic!("already initialized");
        }
        env.storage().instance().set(&ORACLE, &oracle);
        env.storage().instance().set(&TOKEN, &token);
    }

    pub fn release_reward(env: Env, contributor: Address, issue_id: u64, amount: i128) {
        let oracle: Address = env.storage().instance().get(&ORACLE).unwrap();
        oracle.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let mut paid = get_paid(&env);
        if paid.contains_key(issue_id) {
            panic!("issue already paid");
        }
        paid.set(issue_id, true);
        env.storage().instance().set(&PAID, &paid);

        let token: Address = env.storage().instance().get(&TOKEN).unwrap();
        token::Client::new(&env, &token).transfer(
            &env.current_contract_address(),
            &contributor,
            &amount,
        );
    }

    pub fn paid(env: Env, issue_id: u64) -> bool {
        get_paid(&env).get(issue_id).unwrap_or(false)
    }

    pub fn set_oracle(env: Env, new_oracle: Address) {
        let oracle: Address = env.storage().instance().get(&ORACLE).unwrap();
        oracle.require_auth();
        env.storage().instance().set(&ORACLE, &new_oracle);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{token, Env};

    fn setup() -> (Env, Address, Address, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, WaveVault);
        let oracle = Address::generate(&env);
        let contributor = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract(oracle.clone());

        let client = WaveVaultClient::new(&env, &contract_id);
        client.initialize(&oracle, &token_id);

        (env, contract_id, oracle, contributor, token_id)
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, WaveVault);
        let oracle = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract(oracle.clone());

        let client = WaveVaultClient::new(&env, &contract_id);
        client.initialize(&oracle, &token_id);
    }

    #[test]
    fn test_release_reward() {
        let (env, contract_id, _oracle, contributor, token_id) = setup();
        let client = WaveVaultClient::new(&env, &contract_id);

        // Mint tokens to the contract so it can pay
        let token_client = token::Client::new(&env, &token_id);
        token_client.mint(&contract_id, &1_000_000_000);

        client.release_reward(&contributor, &1, &100_000_000);

        assert!(client.paid(&1));
    }

    #[test]
    fn test_revert_duplicate_payment() {
        let (env, contract_id, _oracle, contributor, token_id) = setup();
        let client = WaveVaultClient::new(&env, &contract_id);

        let token_client = token::Client::new(&env, &token_id);
        token_client.mint(&contract_id, &1_000_000_000);

        client.release_reward(&contributor, &1, &100_000_000);

        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            client.release_reward(&contributor, &1, &100_000_000);
        }));
        assert!(result.is_err());
    }

    #[test]
    fn test_revert_zero_amount() {
        let (env, contract_id, _oracle, _contributor, _token_id) = setup();
        let client = WaveVaultClient::new(&env, &contract_id);

        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            client.release_reward(&Address::generate(&env), &1, &0);
        }));
        assert!(result.is_err());
    }

    #[test]
    fn test_paid_returns_false_for_unpaid() {
        let (env, contract_id, _oracle, _contributor, _token_id) = setup();
        let client = WaveVaultClient::new(&env, &contract_id);

        assert!(!client.paid(&42));
    }

    #[test]
    fn test_set_oracle() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, WaveVault);
        let oracle = Address::generate(&env);
        let new_oracle = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract(oracle.clone());

        let client = WaveVaultClient::new(&env, &contract_id);
        client.initialize(&oracle, &token_id);

        client.set_oracle(&new_oracle);
    }

    #[test]
    fn test_multiple_rewards() {
        let (env, contract_id, _oracle, contributor, token_id) = setup();
        let client = WaveVaultClient::new(&env, &contract_id);

        let contributor2 = Address::generate(&env);

        let token_client = token::Client::new(&env, &token_id);
        token_client.mint(&contract_id, &2_000_000_000);

        client.release_reward(&contributor, &1, &100_000_000);
        client.release_reward(&contributor2, &2, &200_000_000);

        assert!(client.paid(&1));
        assert!(client.paid(&2));
    }
}
