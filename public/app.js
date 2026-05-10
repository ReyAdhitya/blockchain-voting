// Blockchain Voting — frontend.
// Expects ethers v6 loaded via CDN before this script (window.ethers).

const RPC_URL = "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const CANDIDATES = ["Alice", "Bob", "Charlie"];

const ABI = [
  "function castVote(string candidate)",
  "function getVotes(string candidate) view returns (uint256)",
  "function candidateList(uint index) view returns (string)",
  "function hasVoted(address voter) view returns (bool)",
];

const statusEl = document.getElementById("status");
const candidateListEl = document.getElementById("candidate-list");
const resultsListEl = document.getElementById("results-list");

let contract;
let signer;

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = kind ? "status status--" + kind : "status";
}

function errorText(err) {
  return err.reason || err.shortMessage || err.message || String(err);
}

async function connect() {
  setStatus("Connecting to local blockchain…");
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  // Hardhat's local node ships unlocked test accounts, so the provider
  // can hand us a signer directly without MetaMask.
  signer = await provider.getSigner(0);
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  const address = await signer.getAddress();
  setStatus("Connected as " + address, "success");
}

function renderCandidates() {
  candidateListEl.innerHTML = "";
  for (const name of CANDIDATES) {
    const row = document.createElement("div");
    row.className = "candidate";

    const label = document.createElement("span");
    label.textContent = name;

    const button = document.createElement("button");
    button.textContent = "Vote for " + name;
    button.addEventListener("click", () => castVote(name, button));

    row.append(label, button);
    candidateListEl.appendChild(row);
  }
}

async function renderResults() {
  resultsListEl.innerHTML = "";
  for (const name of CANDIDATES) {
    const votes = await contract.getVotes(name);
    const row = document.createElement("li");
    row.textContent = name + ": " + votes.toString();
    resultsListEl.appendChild(row);
  }
}

async function castVote(name, button) {
  button.disabled = true;
  try {
    setStatus("Submitting vote for " + name + "…");
    const tx = await contract.castVote(name);
    setStatus("Tx sent (" + tx.hash.slice(0, 10) + "…) — waiting for confirmation");
    await tx.wait();
    setStatus("Vote for " + name + " confirmed", "success");
    await renderResults();
  } catch (err) {
    console.error(err);
    setStatus("Vote failed: " + errorText(err), "error");
  } finally {
    button.disabled = false;
  }
}

(async () => {
  try {
    await connect();
    renderCandidates();
    await renderResults();
  } catch (err) {
    console.error(err);
    setStatus("Initialization failed: " + errorText(err), "error");
  }
})();
