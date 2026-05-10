# Blockchain Student Council Election

A working voting dApp with **commit-reveal ballot secrecy**, an **admin-managed voter whitelist**, and **time-gated phases** (Registration → Voting → Reveal → Ended).

Built on Hardhat 3, Solidity 0.8.28, ethers v6, and a vanilla-JS MetaMask frontend. Two contracts ship in this repo:

- `contracts/Voting.sol` — the original learning toy (open voting, no whitelist, no secrecy)
- `contracts/Election.sol` — the realistic version this README walks you through

---

## What problems this solves (and what it doesn't)

| Problem | How `Election.sol` handles it |
| --- | --- |
| **Identity / sybil resistance** | Admin whitelists eligible wallet addresses during the Registration phase. Off-chain trust at registration; on-chain enforcement after. |
| **Vote secrecy** | Commit-reveal: voters submit `keccak256(candidate, nonce)` during Voting; the choice stays hidden until the Reveal phase. |
| **Bounded election** | Three immutable deadlines set at deploy time. The contract refuses out-of-phase actions automatically. |
| **Tamper-proof tally** | Counts are incremented only on valid reveals; commitment hashes prevent post-hoc vote changes. |
| **Auditability** | Every registration / commit / reveal emits an event. Anyone can replay history and verify the count. |

**Honest limits** of this design:

- **Coercion resistance is partial.** A coercer who has access to your browser can read the saved nonce in `localStorage` and verify how you voted. True coercion-resistance needs MACI or zk-SNARK voting, which is out of scope.
- **Gas costs.** On Ethereum mainnet a vote costs real money. Deploy on a cheap L2 (Base, Arbitrum, Polygon) where each tx is ~$0.001. For zero-cost UX, students would need a relayer (a backend that submits txs on their behalf) — also out of scope here.
- **Off-chain identity.** "Whitelisting verified students" depends on whoever runs registration. The contract makes the *count* trustworthy, not the *eligibility list*. To minimise that trust, publish the registration steps publicly (e.g. "students presented IDs in person between dates X and Y") so anyone can audit the roster.

---

## Local quickstart

You'll need Node.js 20+ and a browser with [MetaMask](https://metamask.io/download).

### 1. Install dependencies

```powershell
npm install
```

### 2. Compile the contract

```powershell
npx hardhat compile
```

### 3. Start a local Hardhat node (terminal A)

```powershell
npx hardhat node
```

Leave this running. It prints 20 test accounts with private keys — note them; account #0 will be the admin.

### 4. Deploy the Election contract (terminal B)

```powershell
npx hardhat ignition deploy ignition/modules/Election.ts --network localhost
```

The output prints a deployed address, e.g. `ElectionModule#Election - 0x5FbDB23…`. Copy it.

Open `public/app.js`, find:

```js
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
```

…and replace with the address Ignition printed (it'll usually be the same on a fresh local node, but verify).

### 5. Connect MetaMask to the local node

In MetaMask:

1. Add a custom network: RPC URL `http://127.0.0.1:8545`, Chain ID `31337`, Currency symbol `ETH`.
2. Import account #0 (the admin) using the private key Hardhat printed when you ran `npx hardhat node`. **Local test keys only — never paste a real-funds private key into MetaMask.**
3. Import accounts #1, #2, #3 too — these will be your test voters.

### 6. Serve the frontend (terminal C)

```powershell
npx http-server "D:\SWE Projexts\blockchain-voting\public" -p 8080 -c-1
```

Open <http://localhost:8080>.

### 7. Run an election

1. With MetaMask on **account #0 (admin)**, click **Connect MetaMask**. You should see an "(admin)" tag.
2. In the admin panel, paste the addresses of accounts #1, #2, #3 (one per line) and click **Register voters**.
3. Wait for the Registration phase to end. (Default is 10 minutes — for testing you can lower this in `ignition/modules/Election.ts`, or skip ahead by running `npx hardhat console --network localhost` and:
   ```js
   await network.provider.send("evm_increaseTime", [600]);
   await network.provider.send("evm_mine");
   ```
4. Switch MetaMask to account #1, refresh the page, and cast a vote. Repeat for #2 and #3.
5. Fast-forward to the Reveal phase the same way and reveal each vote.
6. Final results show on the page.

---

## Tests

```powershell
# In one terminal:
npx hardhat node

# In another:
npx hardhat compile
npx hardhat test
```

The tests cover phase transitions, admin-only registration, commit-reveal correctness, and rejection of out-of-phase actions.

---

## Project structure

```
contracts/
  Voting.sol          ← v1 learning artifact (public votes, no whitelist)
  Election.sol        ← v2 with whitelist + commit-reveal + time windows
ignition/modules/
  Voting.ts
  Election.ts         ← parameterised: candidates + phase durations
test/
  Voting.ts
  Election.ts         ← end-to-end commit-reveal flow
public/
  index.html          ← MetaMask connect, phase-aware UI, admin panel
  app.js              ← frontend logic (ethers v6 via CDN)
  style.css           ← dark/violet glassmorphism design
```

---

## Going further

- **Deploy on a real chain.** Base or Polygon mainnet, fees ~$0.001 per vote. Update `hardhat.config.ts` networks block and run `npx hardhat ignition deploy --network <name>`.
- **Make voting truly gasless.** Add EIP-712 signed messages + a backend relayer that submits transactions on behalf of voters. Voters sign in the browser, never need ETH.
- **Add MACI for coercion resistance.** [Privacy & Scaling Explorations' MACI](https://maci.pse.dev/) is the production-grade way to do it. Major undertaking.
- **Snapshot the voter roster on-chain.** Right now `eligible` is mutable until the registration deadline. For maximum auditability, freeze the list with a Merkle root after registration ends and prove eligibility with Merkle proofs at vote time.
