// Student Council Election — frontend.
// Expects ethers v6 loaded via CDN as window.ethers, MetaMask installed.

// ---- Configuration ---------------------------------------------------------

// Deployed Election contract on Sepolia testnet.
// To redeploy, run `npx hardhat ignition deploy ignition/modules/Election.ts --network sepolia`
// and paste the new address here.
const CONTRACT_ADDRESS = "0x205c0757B53EC9b2C02553AFD85b6240fa67530B";

const ABI = [
    "function admin() view returns (address)",
    "function currentPhase() view returns (uint8)",
    "function registrationDeadline() view returns (uint256)",
    "function votingDeadline() view returns (uint256)",
    "function revealDeadline() view returns (uint256)",
    "function getCandidates() view returns (string[])",
    "function eligible(address) view returns (bool)",
    "function commitments(address) view returns (bytes32)",
    "function hasRevealed(address) view returns (bool)",
    "function getVotes(string) view returns (uint256)",
    "function registerVoter(address)",
    "function registerVoters(address[])",
    "function commitVote(bytes32)",
    "function revealVote(string,bytes32)",
    "event VoterRegistered(address indexed voter)",
    "event VoteCommitted(address indexed voter)",
    "event VoteRevealed(address indexed voter, string candidate)",
];

const PHASE_NAMES = ["Registration", "Voting", "Reveal", "Ended"];

// ---- DOM handles -----------------------------------------------------------

const $ = (id) => document.getElementById(id);
const statusEl = $("status");
const accountEl = $("account");
const phaseEl = $("phase");
const countdownEl = $("countdown");
const phaseBodyEl = $("phase-body");
const adminPanelEl = $("admin-panel");
const resultsListEl = $("results-list");
const connectBtn = $("connect-btn");

// ---- State -----------------------------------------------------------------

let provider;          // ethers.BrowserProvider
let signer;            // ethers.Signer (the connected MetaMask account)
let contract;          // ethers.Contract bound to the signer
let userAddress = null;
let isAdmin = false;
let pollHandle = null;

// ---- Helpers ---------------------------------------------------------------

function setStatus(message, kind = "info") {
    statusEl.textContent = message;
    statusEl.className = "status status--" + kind;
}

function clearStatus() {
    statusEl.textContent = "";
    statusEl.className = "status";
}

function errorText(err) {
    return err.reason || err.shortMessage || err.message || String(err);
}

function nonceStorageKey(addr) {
    return `election:${CONTRACT_ADDRESS.toLowerCase()}:${addr.toLowerCase()}`;
}

function saveBallot(addr, candidate, nonce) {
    localStorage.setItem(nonceStorageKey(addr), JSON.stringify({ candidate, nonce }));
}

function loadBallot(addr) {
    const raw = localStorage.getItem(nonceStorageKey(addr));
    return raw ? JSON.parse(raw) : null;
}

function clearBallot(addr) {
    localStorage.removeItem(nonceStorageKey(addr));
}

function makeCommitment(candidate, nonce) {
    return ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ["string", "bytes32"], [candidate, nonce]
        )
    );
}

function randomNonce() {
    return ethers.hexlify(ethers.randomBytes(32));
}

function fmtCountdown(secondsLeft) {
    if (secondsLeft <= 0) return "0s";
    const h = Math.floor(secondsLeft / 3600);
    const m = Math.floor((secondsLeft % 3600) / 60);
    const s = secondsLeft % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

// ---- Connect ---------------------------------------------------------------

async function connect() {
    if (!window.ethereum) {
        setStatus("MetaMask not found. Install it from metamask.io", "error");
        return;
    }
    try {
        setStatus("Requesting wallet access…");
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        const adminAddr = await contract.admin();
        isAdmin = adminAddr.toLowerCase() === userAddress.toLowerCase();

        accountEl.textContent = userAddress.slice(0, 6) + "…" + userAddress.slice(-4)
            + (isAdmin ? "  (admin)" : "");
        connectBtn.style.display = "none";

        setStatus("Wallet connected", "success");
        setTimeout(clearStatus, 2000);

        await refreshAll();
        startPolling();
        subscribeToEvents();

        // Reconnect if account/network changes
        window.ethereum.on("accountsChanged", () => location.reload());
        window.ethereum.on("chainChanged", () => location.reload());
    } catch (err) {
        console.error(err);
        setStatus("Connect failed: " + errorText(err), "error");
    }
}

// ---- Polling + events ------------------------------------------------------

function startPolling() {
    if (pollHandle) clearInterval(pollHandle);
    pollHandle = setInterval(refreshAll, 5000);
}

function subscribeToEvents() {
    contract.on("VoterRegistered", () => refreshAll());
    contract.on("VoteCommitted",  () => refreshAll());
    contract.on("VoteRevealed",   () => refreshAll());
}

// ---- Refresh ---------------------------------------------------------------

async function refreshAll() {
    try {
        const [phase, regDl, voteDl, revDl] = await Promise.all([
            contract.currentPhase(),
            contract.registrationDeadline(),
            contract.votingDeadline(),
            contract.revealDeadline(),
        ]);
        const phaseNum = Number(phase);

        renderPhaseHeader(phaseNum, Number(regDl), Number(voteDl), Number(revDl));
        await renderPhaseBody(phaseNum);
        await renderResults();
        await renderAdminPanel(phaseNum);
    } catch (err) {
        console.error(err);
        setStatus("Refresh failed: " + errorText(err), "error");
    }
}

function renderPhaseHeader(phaseNum, regDl, voteDl, revDl) {
    phaseEl.textContent = PHASE_NAMES[phaseNum];
    phaseEl.dataset.phase = PHASE_NAMES[phaseNum].toLowerCase();

    const now = Math.floor(Date.now() / 1000);
    const nextDeadline =
        phaseNum === 0 ? regDl :
        phaseNum === 1 ? voteDl :
        phaseNum === 2 ? revDl : 0;

    countdownEl.textContent = phaseNum === 3
        ? "Election ended"
        : "Phase ends in " + fmtCountdown(nextDeadline - now);
}

// ---- Phase body ------------------------------------------------------------

async function renderPhaseBody(phaseNum) {
    phaseBodyEl.innerHTML = "";

    if (phaseNum === 0) {
        const note = document.createElement("p");
        note.className = "muted";
        note.textContent = "Registration is open. The admin is adding eligible voters.";
        phaseBodyEl.appendChild(note);
        return;
    }

    if (phaseNum === 1) await renderVotingBody();
    if (phaseNum === 2) await renderRevealBody();
    if (phaseNum === 3) {
        const note = document.createElement("p");
        note.className = "muted";
        note.textContent = "The election has ended. Final results below.";
        phaseBodyEl.appendChild(note);
    }
}

async function renderVotingBody() {
    const isEligible = await contract.eligible(userAddress);
    const existing = await contract.commitments(userAddress);
    const alreadyCommitted = existing !== ethers.ZeroHash;

    if (!isEligible) {
        const p = document.createElement("p");
        p.className = "muted";
        p.textContent = "Your wallet is not on the voter list. Ask the admin to register " + userAddress;
        phaseBodyEl.appendChild(p);
        return;
    }

    if (alreadyCommitted) {
        const p = document.createElement("p");
        p.className = "muted";
        p.innerHTML = "Vote committed. Come back during the <b>Reveal</b> phase to reveal it. " +
                      "<br><small>Don't clear your browser data — your nonce is stored locally.</small>";
        phaseBodyEl.appendChild(p);
        return;
    }

    const heading = document.createElement("h3");
    heading.textContent = "Choose your candidate";
    phaseBodyEl.appendChild(heading);

    const candidates = await contract.getCandidates();
    const list = document.createElement("div");
    list.id = "candidate-list";

    for (const name of candidates) {
        const row = document.createElement("div");
        row.className = "candidate";

        const label = document.createElement("span");
        label.textContent = name;

        const button = document.createElement("button");
        button.textContent = "Vote for " + name;
        button.addEventListener("click", () => commitVote(name, button));

        row.append(label, button);
        list.appendChild(row);
    }
    phaseBodyEl.appendChild(list);
}

async function renderRevealBody() {
    const commitment = await contract.commitments(userAddress);
    if (commitment === ethers.ZeroHash) {
        const p = document.createElement("p");
        p.className = "muted";
        p.textContent = "You did not commit a vote during the voting phase.";
        phaseBodyEl.appendChild(p);
        return;
    }

    const revealed = await contract.hasRevealed(userAddress);
    if (revealed) {
        const p = document.createElement("p");
        p.className = "muted success";
        p.textContent = "You have already revealed your vote. Thanks!";
        phaseBodyEl.appendChild(p);
        return;
    }

    const ballot = loadBallot(userAddress);
    if (!ballot) {
        const p = document.createElement("p");
        p.className = "muted error";
        p.innerHTML = "We can't find your saved nonce in this browser. " +
                      "If you committed from a different device, switch to that browser/device to reveal. " +
                      "Without the nonce your vote cannot be revealed (and won't count).";
        phaseBodyEl.appendChild(p);
        return;
    }

    const p = document.createElement("p");
    p.innerHTML = `Your committed vote was for <b>${ballot.candidate}</b>. ` +
                  `Click below to publish it on-chain so it counts in the tally.`;

    const btn = document.createElement("button");
    btn.className = "primary";
    btn.textContent = "Reveal my vote for " + ballot.candidate;
    btn.addEventListener("click", () => revealVote(ballot, btn));

    phaseBodyEl.append(p, btn);
}

// ---- Vote actions ----------------------------------------------------------

async function commitVote(candidate, button) {
    button.disabled = true;
    try {
        const nonce = randomNonce();
        const commitment = makeCommitment(candidate, nonce);

        // Save the ballot BEFORE sending the tx — if the tab crashes after
        // submit, we still need the nonce to reveal later.
        saveBallot(userAddress, candidate, nonce);

        setStatus(`Committing vote for ${candidate}…`);
        const tx = await contract.commitVote(commitment);
        setStatus(`Tx sent (${tx.hash.slice(0, 10)}…) — waiting for confirmation`);
        await tx.wait();

        setStatus(`Vote committed. Reveal it during the reveal phase.`, "success");
        await refreshAll();
    } catch (err) {
        console.error(err);
        // If the tx never landed, drop the saved ballot so the UI can retry cleanly
        const onchain = await contract.commitments(userAddress).catch(() => ethers.ZeroHash);
        if (onchain === ethers.ZeroHash) clearBallot(userAddress);
        setStatus("Commit failed: " + errorText(err), "error");
    } finally {
        button.disabled = false;
    }
}

async function revealVote(ballot, button) {
    button.disabled = true;
    try {
        setStatus(`Revealing vote for ${ballot.candidate}…`);
        const tx = await contract.revealVote(ballot.candidate, ballot.nonce);
        setStatus(`Tx sent (${tx.hash.slice(0, 10)}…) — waiting for confirmation`);
        await tx.wait();
        setStatus("Vote revealed and counted", "success");
        clearBallot(userAddress);
        await refreshAll();
    } catch (err) {
        console.error(err);
        setStatus("Reveal failed: " + errorText(err), "error");
    } finally {
        button.disabled = false;
    }
}

// ---- Results ---------------------------------------------------------------

async function renderResults() {
    const candidates = await contract.getCandidates();
    const counts = await Promise.all(candidates.map((c) => contract.getVotes(c)));
    const total = counts.reduce((s, v) => s + Number(v), 0);

    resultsListEl.innerHTML = "";
    candidates.forEach((name, i) => {
        const count = Number(counts[i]);
        const pct = total === 0 ? 0 : (count / total) * 100;

        const li = document.createElement("li");
        li.style.setProperty("--pct", pct + "%");
        li.textContent = `${name} — ${count} vote${count === 1 ? "" : "s"} (${pct.toFixed(0)}%)`;
        resultsListEl.appendChild(li);
    });
}

// ---- Admin panel -----------------------------------------------------------

async function renderAdminPanel(phaseNum) {
    if (!isAdmin) {
        adminPanelEl.style.display = "none";
        return;
    }
    adminPanelEl.style.display = "block";
    adminPanelEl.innerHTML = "";

    const heading = document.createElement("h2");
    heading.textContent = "Admin panel";
    adminPanelEl.appendChild(heading);

    if (phaseNum !== 0) {
        const note = document.createElement("p");
        note.className = "muted";
        note.textContent = "Registration is closed. You can no longer add voters.";
        adminPanelEl.appendChild(note);
        return;
    }

    const help = document.createElement("p");
    help.className = "muted";
    help.innerHTML = "Add voter wallet addresses, one per line. Click <b>Register</b> to whitelist them.";
    adminPanelEl.appendChild(help);

    const textarea = document.createElement("textarea");
    textarea.id = "voter-input";
    textarea.placeholder = "0x1234…\n0xabcd…";
    textarea.rows = 5;
    adminPanelEl.appendChild(textarea);

    const btn = document.createElement("button");
    btn.className = "primary";
    btn.textContent = "Register voters";
    btn.addEventListener("click", () => registerVoters(textarea, btn));
    adminPanelEl.appendChild(btn);
}

async function registerVoters(textarea, button) {
    const lines = textarea.value
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    const valid = [];
    for (const line of lines) {
        try {
            valid.push(ethers.getAddress(line));
        } catch {
            setStatus(`Invalid address: ${line}`, "error");
            return;
        }
    }
    if (valid.length === 0) {
        setStatus("Enter at least one address", "error");
        return;
    }

    button.disabled = true;
    try {
        setStatus(`Registering ${valid.length} voter${valid.length === 1 ? "" : "s"}…`);
        const tx = valid.length === 1
            ? await contract.registerVoter(valid[0])
            : await contract.registerVoters(valid);
        await tx.wait();
        setStatus("Voters registered", "success");
        textarea.value = "";
        await refreshAll();
    } catch (err) {
        console.error(err);
        setStatus("Registration failed: " + errorText(err), "error");
    } finally {
        button.disabled = false;
    }
}

// ---- Boot ------------------------------------------------------------------

connectBtn.addEventListener("click", connect);
