# Blockchain Student Council Election

A working voting dApp on Ethereum — **transparent**, **tamper-proof**, and **ballot-secret** via commit-reveal cryptography.

Built as a learning project to demonstrate where blockchain genuinely solves problems that web2 tools (Google Forms, paper ballots, district websites) cannot: removing the trusted central authority that holds and counts votes. Once an election is over, anyone in the world can replay the contract's events and verify the tally — **the math doesn't lie**.

---

## 🔗 Live demo

- **App:** <https://blockchain-voting-gamma.vercel.app>
- **Contract on Sepolia:** [`0x205c0757B53EC9b2C02553AFD85b6240fa67530B`](https://sepolia.etherscan.io/address/0x205c0757B53EC9b2C02553AFD85b6240fa67530B)

To use the live demo:

1. Install [MetaMask](https://metamask.io/download)
2. Switch MetaMask to the **Sepolia** test network
3. Get free Sepolia ETH from a [faucet](https://sepolia-faucet.pk910.de/)
4. Ask the admin to register your wallet address (the dApp shows your address on connect — share it with whoever's running the election)
5. Vote during the voting window, then come back and reveal during the reveal window

---

## What this project demonstrates

| Blockchain fundamental | How you see it here |
| --- | --- |
| **Decentralization** | No "school IT person" can change the count. The contract enforces every rule itself. |
| **Immutability** | Once a vote is cast, it can't be retroactively edited or deleted by anyone — including the contract owner. |
| **Public auditability** | Every registration / vote / reveal emits an event readable by anyone via [Etherscan](https://sepolia.etherscan.io/). |
| **Cryptographic identity** | Your wallet signature *is* your identity — no usernames, no passwords, no central database to compromise. |
| **Smart-contract-enforced rules** | "One vote per registered student" and "voting closes at 5pm" are enforced by code, not by honor system. |
| **Ballot secrecy via commit-reveal** | During voting, the chain only sees `keccak256(your-choice + your-secret)`. Your choice is hidden until you reveal it after voting closes — by which point your commitment is already locked in. |
| **Censorship resistance** | The admin can't quietly drop votes they don't like — every transaction is permanently recorded. |

---

## How the contract works

Four phases, each gated by an immutable timestamp baked into the contract at deploy time:

```
   deploy time              +1h               +3h               +4h
       │                     │                 │                 │
       ▼                     ▼                 ▼                 ▼
┌───────────────┐ ┌──────────────────┐ ┌─────────────────┐ ┌───────────┐
│  Registration │ │      Voting      │ │     Reveal      │ │   Ended   │
│ admin adds    │ │ voters submit    │ │ voters publish  │ │ tally is  │
│ eligible      │ │ commit hashes    │ │ choice + nonce, │ │ final and │
│ addresses     │ │ (choice secret)  │ │ contract counts │ │ public    │
└───────────────┘ └──────────────────┘ └─────────────────┘ └───────────┘
```

The **commit-reveal** scheme is the key cryptographic trick:
1. During Voting, the voter sends `keccak256(abi.encode(candidate, randomNonce))`. On-chain observers see only a 32-byte hash — they can't tell who voted for whom.
2. During Reveal, the voter sends the original `candidate` and `nonce`. The contract re-hashes them and accepts the vote only if the result matches the previous commit.
3. The voter cannot change their mind — they're locked in by the original commit. They *can* refuse to reveal, in which case their vote isn't counted.

---

## Project structure

```
contracts/
  Voting.sol          ← v1 learning artifact (open voting, no whitelist)
  Election.sol        ← v2 with whitelist + commit-reveal + time windows
ignition/modules/
  Voting.ts
  Election.ts         ← parameterised: candidates + phase durations
test/
  Voting.ts
  Election.ts         ← end-to-end commit-reveal flow with phase advances
public/
  index.html          ← phase-aware UI, admin panel, MetaMask connect
  app.js              ← frontend logic (ethers v6 via CDN, no bundler)
  style.css           ← dark/violet glassmorphism design
hardhat.config.ts     ← networks: hardhatMainnet, hardhatOp, sepolia, localhost
```

---

## Honest limits of this design

This is a teaching project. For real elections at scale, here's what's still unsolved:

- **Coercion resistance is partial.** A coercer with access to your browser can read the saved nonce in `localStorage` and verify how you voted. True coercion resistance needs [MACI](https://maci.pse.dev/) or zk-SNARK voting (separate, much larger projects).
- **Gas costs.** On Ethereum mainnet a vote costs real money. Deploy on a cheap L2 (Base, Arbitrum, Polygon) where each tx is fractions of a cent. For zero-cost voter UX, add a relayer service.
- **Off-chain identity.** "Whitelisting verified students" depends on whoever runs registration. The contract makes the *count* trustworthy, not the *eligibility list*. To minimise that trust, publish the registration steps publicly (e.g. "students presented IDs on-camera between dates X and Y") so anyone can audit the roster.

---

## Run it locally

You'll need Node.js 20+ and [MetaMask](https://metamask.io/download).

### 1. Install + compile

```powershell
npm install
npx hardhat compile
```

### 2. Start a local Hardhat node (terminal A)

```powershell
npx hardhat node
```

Leave this running. It prints 20 test accounts with private keys; account #0 will be the admin.

### 3. Deploy the Election contract (terminal B)

```powershell
npx hardhat ignition deploy ignition/modules/Election.ts --network localhost
```

Copy the printed address. Open `public/app.js` and update:

```js
const CONTRACT_ADDRESS = "0x...";  // paste deployed address here
```

### 4. Connect MetaMask to the local node

In MetaMask:

1. Add a custom network: RPC `http://127.0.0.1:8545`, Chain ID `31337`, Symbol `ETH`
2. Import accounts #0 (admin) and #1, #2, #3 (test voters) using the private keys Hardhat printed
3. **Local test keys only — never paste a real-funds private key into MetaMask**

### 5. Serve the frontend (terminal C)

```powershell
npx http-server public -p 8080 -c-1
```

Open <http://localhost:8080>.

### 6. Run an election

1. Connect as account #0 → register accounts #1/#2/#3 in the admin panel
2. Fast-forward time (locally only):
   ```powershell
   npx hardhat console --network localhost
   ```
   ```js
   await network.provider.send("evm_increaseTime", [600]); await network.provider.send("evm_mine");
   ```
3. Switch MetaMask to a voter account → refresh → cast a vote
4. Fast-forward to the reveal phase → reveal each vote → see results

---

## Deploy to Sepolia (public testnet)

Already configured in `hardhat.config.ts`. You'll need:

- An RPC URL — get one free from [Alchemy](https://www.alchemy.com/) (Ethereum → Sepolia)
- A test wallet's private key, funded with Sepolia ETH from a [faucet](https://sepolia-faucet.pk910.de/)

Store both in Hardhat's encrypted keystore (never commits them to git):

```powershell
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

Then deploy:

```powershell
npx hardhat ignition deploy ignition/modules/Election.ts --network sepolia
```

Copy the deployed address into `public/app.js` and push to GitHub. If you've connected the repo to Vercel, it'll auto-redeploy with the new address.

---

## Tests

```powershell
# In one terminal
npx hardhat node

# In another
npx hardhat test
```

The test suite covers:
- Phase transitions across deadlines
- Admin-only registration with non-admin rejection
- Bulk registration with duplicate / zero-address handling
- Commit during voting, with eligibility and double-commit rejection
- Reveal with matching/mismatching commitment
- Phase enforcement (no commits during registration, no reveals during voting)
- Full end-to-end flow with three voters and three candidates

---

## Going further

- **Deploy on a real L2.** Base or Polygon mainnet — fees are ~$0.001 per vote.
- **Make voting truly gasless.** Add EIP-712 signed messages + a relayer that submits transactions on behalf of voters; voters sign in the browser and never need ETH.
- **Add MACI for coercion resistance.** [Privacy & Scaling Explorations' MACI](https://maci.pse.dev/) is the production-grade way. Major undertaking.
- **Snapshot the voter roster on-chain.** Right now `eligible` is mutable until the registration deadline. For maximum auditability, freeze the list with a Merkle root after registration ends and prove eligibility with Merkle proofs at vote time.
- **Use soulbound NFTs as voting badges.** Each verified student gets a non-transferable token; the contract checks ownership instead of an admin whitelist. Better for "verified once, vote in many elections."

---

## Tech stack

- **Solidity 0.8.28** — smart contracts
- **Hardhat 3** — dev environment, compilation, deployment, testing
- **Hardhat Ignition** — declarative deployment modules
- **ethers v6** — Ethereum library (used in tests + frontend, loaded via CDN in the browser)
- **Mocha + Chai** — test framework
- **Vercel** — frontend hosting (auto-deploys from this repo)
- **Sepolia testnet** — public Ethereum test network

No build step on the frontend — it's vanilla JavaScript with ethers loaded via `<script>` tag. Anyone can clone, understand, and modify the code.

---

## License

MIT
