// VoteChain — frontend
// Expects ethers v6 via CDN, MetaMask installed, Sepolia network.

// ---- Config ----------------------------------------------------------------

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

const PHASE_KEYS  = ["phaseRegistration", "phaseVoting", "phaseReveal", "phaseEnded"];
const PHASE_DATA  = ["registration", "voting", "reveal", "ended"];
const PHASE_PROGRESS = ["0%", "33%", "66%", "100%"];

const AVATAR_GRADIENTS = [
    ["oklch(0.80 0.16 162)", "oklch(0.80 0.13 210)"],
    ["oklch(0.82 0.14 215)", "oklch(0.78 0.13 270)"],
    ["oklch(0.84 0.15 78)",  "oklch(0.78 0.13 25)"],
    ["oklch(0.78 0.16 18)",  "oklch(0.82 0.12 70)"],
    ["oklch(0.74 0.16 268)", "oklch(0.82 0.12 200)"],
];

// ---- i18n ------------------------------------------------------------------

const TRANSLATIONS = {
    en: {
        brand: "VoteChain",
        heroBadge: "Blockchain Powered",
        titleHtml: `Student Council<br/><em>Election</em> 2026`,
        subtitle: "Transparent, tamper-proof voting on Ethereum.",
        verifyLine: "Every vote is verifiable on-chain.",
        statBlock: "Block Height",
        statVotes: "Total Votes",
        statPhase: "Current Phase",
        statNetwork: "Network",
        navVote: "Vote",
        navResults: "Results",
        navAudit: "Audit",
        connectedWallet: "Connected Wallet",
        notConnected: "— not connected —",
        connectMetaMask: "Connect Wallet",
        currentPhase: "Current Phase",
        waitingForWallet: "Waiting for wallet…",
        yourBallot: "Your Ballot",
        contractLabel: "Contract",
        connectToParticipate: "Connect your wallet to participate.",
        liveResults: "Live Results",
        tweaksTitle: "Accent",

        phaseRegistration: "Registration",
        phaseVoting:       "Voting",
        phaseReveal:       "Reveal",
        phaseEnded:        "Ended",

        subLive:   "live now",
        subClosed: "closed",
        subSoon:   "upcoming",

        electionEnded: "Election ended",
        phaseEndsIn:   (time) => `Ends in ${time}`,

        registrationOpen:   "Registration is open. The admin is adding eligible voters.",
        chooseCandidate:    "Choose your candidate",
        yourSelection:      "Your Selection",
        selectAbove:        "select a candidate above",
        submitVote:         "Submit Vote",
        voteCommittedMsg:   "Vote committed. Return during the <b>Reveal</b> phase to reveal it on-chain.<br><small>Don't clear browser data — your nonce is saved locally.</small>",
        notEligible:        (addr) => `Your wallet is not on the voter list. Ask the admin to register ${addr}`,
        electionEndedFinal: "The election has ended. Final results are below.",

        noCommitment:     "You did not commit a vote during the voting phase.",
        alreadyRevealed:  "You have already revealed your vote. Thanks!",
        noNonce:          "Nonce not found in this browser. If you committed from a different device, switch to it to reveal.",
        revealVoteFor:    (name) => `Reveal vote for ${name}`,
        committedVoteFor: (name) => `Your committed vote is for <b>${name}</b>. Click below to publish it on-chain.`,

        adminPanel:         "Admin Panel",
        registrationClosed: "Registration is closed. No more voters can be added.",
        addVotersHelp:      "Add voter wallet addresses, one per line. Click <b>Register</b> to whitelist them.",
        registerVoters:     "Register voters",

        requestingAccess:     "Requesting wallet access…",
        walletConnected:      "Wallet connected",
        metamaskNotFound:     "MetaMask not found — install it at metamask.io",
        connectFailed:        (e) => `Connect failed: ${e}`,
        refreshFailed:        (e) => `Refresh failed: ${e}`,
        committingVote:       (name) => `Committing vote for ${name}…`,
        txSent:               (hash) => `Tx sent (${hash}…) — awaiting confirmation`,
        voteCommittedSuccess: "Vote committed — reveal it during the reveal phase",
        commitFailed:         (e) => `Commit failed: ${e}`,
        revealingVote:        (name) => `Revealing vote for ${name}…`,
        voteRevealedSuccess:  "Vote revealed and counted",
        revealFailed:         (e) => `Reveal failed: ${e}`,
        registering:          (n) => `Registering ${n} voter${n === 1 ? "" : "s"}…`,
        votersRegistered:     "Voters registered",
        invalidAddress:       (addr) => `Invalid address: ${addr}`,
        enterAtLeastOne:      "Enter at least one address",
        registrationFailed:   (e) => `Registration failed: ${e}`,
        adminSuffix:          " (admin)",
        resultsLine:          (name, count, pct) => `${name} — ${count} vote${count === 1 ? "" : "s"} (${pct}%)`,
    },
    id: {
        brand: "VoteChain",
        heroBadge: "Berbasis Blockchain",
        titleHtml: `Pemilihan<br/><em>OSIS</em> 2026`,
        subtitle: "Pemungutan suara transparan dan tak bisa dimanipulasi di Ethereum.",
        verifyLine: "Setiap suara dapat diverifikasi di blockchain.",
        statBlock: "Tinggi Blok",
        statVotes: "Total Suara",
        statPhase: "Fase Saat Ini",
        statNetwork: "Jaringan",
        navVote: "Pilih",
        navResults: "Hasil",
        navAudit: "Audit",
        connectedWallet: "Dompet Terhubung",
        notConnected: "— belum terhubung —",
        connectMetaMask: "Hubungkan Dompet",
        currentPhase: "Fase Saat Ini",
        waitingForWallet: "Menunggu dompet…",
        yourBallot: "Surat Suara",
        contractLabel: "Kontrak",
        connectToParticipate: "Hubungkan dompet untuk berpartisipasi.",
        liveResults: "Hasil Langsung",
        tweaksTitle: "Aksen",

        phaseRegistration: "Pendaftaran",
        phaseVoting:       "Pemungutan",
        phaseReveal:       "Pengungkapan",
        phaseEnded:        "Selesai",

        subLive:   "sedang berlangsung",
        subClosed: "ditutup",
        subSoon:   "akan datang",

        electionEnded: "Pemilihan selesai",
        phaseEndsIn:   (time) => `Berakhir dalam ${time}`,

        registrationOpen:   "Pendaftaran dibuka. Admin sedang menambahkan pemilih.",
        chooseCandidate:    "Pilih kandidat Anda",
        yourSelection:      "Pilihan Anda",
        selectAbove:        "pilih kandidat di atas",
        submitVote:         "Kirim Suara",
        voteCommittedMsg:   "Suara tersimpan. Kembali saat fase <b>Pengungkapan</b> untuk mengungkapkannya.<br><small>Jangan hapus data browser — nonce tersimpan secara lokal.</small>",
        notEligible:        (addr) => `Dompet Anda tidak terdaftar. Minta admin untuk mendaftarkan ${addr}`,
        electionEndedFinal: "Pemilihan telah berakhir. Hasil akhir ditampilkan di bawah.",

        noCommitment:     "Anda tidak menyimpan suara selama fase pemungutan.",
        alreadyRevealed:  "Anda sudah mengungkapkan suara. Terima kasih!",
        noNonce:          "Nonce tidak ditemukan di browser ini. Jika Anda memilih dari perangkat lain, gunakan perangkat tersebut.",
        revealVoteFor:    (name) => `Ungkap suara untuk ${name}`,
        committedVoteFor: (name) => `Suara Anda tersimpan untuk <b>${name}</b>. Klik di bawah untuk menerbitkan ke blockchain.`,

        adminPanel:         "Panel Admin",
        registrationClosed: "Pendaftaran ditutup. Tidak ada pemilih baru yang dapat ditambahkan.",
        addVotersHelp:      "Tambahkan alamat dompet pemilih, satu per baris. Klik <b>Daftarkan</b> untuk memasukkan ke whitelist.",
        registerVoters:     "Daftarkan pemilih",

        requestingAccess:     "Meminta akses dompet…",
        walletConnected:      "Dompet terhubung",
        metamaskNotFound:     "MetaMask tidak ditemukan — instal di metamask.io",
        connectFailed:        (e) => `Koneksi gagal: ${e}`,
        refreshFailed:        (e) => `Pembaruan gagal: ${e}`,
        committingVote:       (name) => `Menyimpan suara untuk ${name}…`,
        txSent:               (hash) => `Tx terkirim (${hash}…) — menunggu konfirmasi`,
        voteCommittedSuccess: "Suara tersimpan — ungkapkan saat fase pengungkapan",
        commitFailed:         (e) => `Gagal menyimpan: ${e}`,
        revealingVote:        (name) => `Mengungkapkan suara untuk ${name}…`,
        voteRevealedSuccess:  "Suara diungkapkan dan dihitung",
        revealFailed:         (e) => `Gagal mengungkapkan: ${e}`,
        registering:          (n) => `Mendaftarkan ${n} pemilih…`,
        votersRegistered:     "Pemilih terdaftar",
        invalidAddress:       (addr) => `Alamat tidak valid: ${addr}`,
        enterAtLeastOne:      "Masukkan minimal satu alamat",
        registrationFailed:   (e) => `Pendaftaran gagal: ${e}`,
        adminSuffix:          " (admin)",
        resultsLine:          (name, count, pct) => `${name} — ${count} suara (${pct}%)`,
    },
};

let currentLang = localStorage.getItem("lang") || "en";

function t(key, ...args) {
    const val = TRANSLATIONS[currentLang][key];
    return typeof val === "function" ? val(...args) : (val ?? key);
}

function applyLang() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
        el.innerHTML = t(el.dataset.i18nHtml);
    });
    if (!userAddress) {
        accountEl.textContent = t("notConnected");
        countdownEl.textContent = t("waitingForWallet");
        phaseBodyEl.innerHTML = `<div class="card"><p class="muted">${t("connectToParticipate")}</p></div>`;
    }
    if (contract) refreshAll();
}

// ---- Theme -----------------------------------------------------------------

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
    const sun = document.querySelector(".icon-sun");
    const moon = document.querySelector(".icon-moon");
    if (theme === "light") { sun.style.display = "block"; moon.style.display = "none"; }
    else                   { sun.style.display = "none";  moon.style.display = "block"; }
}

// ---- DOM handles -----------------------------------------------------------

const $ = (id) => document.getElementById(id);
const accountEl     = $("account");
const phaseEl       = $("phase");
const countdownEl   = $("countdown");
const phaseBodyEl   = $("phase-body");
const adminPanelEl  = $("admin-panel");
const resultsListEl = $("results-list");
const connectBtn    = $("connect-btn");
const toastEl       = $("toast");
const toastMsgEl    = $("toast-msg");
const blockNumEl    = $("block-num");
const sBlockEl      = $("s-block");
const sVotesEl      = $("s-votes");
const sPhaseEl      = $("s-phase");
const timelineEl    = $("timeline");

// ---- State -----------------------------------------------------------------

let provider;
let signer;
let contract;
let userAddress   = null;
let isAdmin       = false;
let pollHandle    = null;
let toastTimer    = null;
let currentVoteSelection = null;

// ---- Toast -----------------------------------------------------------------

function showToast(msg, kind = "ok") {
    toastMsgEl.textContent = msg;
    const ok  = toastEl.querySelector(".toast-icon.ok");
    const err = toastEl.querySelector(".toast-icon.err");
    ok.style.display  = kind === "ok"  ? "block" : "none";
    err.style.display = kind === "err" ? "block" : "none";
    toastEl.classList.toggle("err", kind === "err");
    toastEl.classList.add("in");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("in"), kind === "err" ? 5000 : 3000);
}

// ---- Helpers ---------------------------------------------------------------

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
        ethers.AbiCoder.defaultAbiCoder().encode(["string", "bytes32"], [candidate, nonce])
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

function initials(name) {
    return name.split(" ").map((w) => w[0] || "").join("").slice(0, 2).toUpperCase() || "??";
}

function flashStat(el) {
    const stat = el.closest(".stat");
    if (!stat) return;
    stat.classList.remove("flash");
    void stat.offsetWidth;
    stat.classList.add("flash");
}

// ---- Connect ---------------------------------------------------------------

async function connect() {
    if (!window.ethereum) {
        showToast(t("metamaskNotFound"), "err");
        return;
    }
    try {
        connectBtn.innerHTML = `<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.2-8.5"/></svg> ${t("requestingAccess")}`;
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        const adminAddr = await contract.admin();
        isAdmin = adminAddr.toLowerCase() === userAddress.toLowerCase();

        accountEl.textContent = userAddress.slice(0, 6) + "…" + userAddress.slice(-4)
            + (isAdmin ? t("adminSuffix") : "");
        accountEl.classList.remove("muted");

        connectBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg> Connected`;
        connectBtn.disabled = true;
        connectBtn.style.opacity = "0.7";
        connectBtn.style.cursor = "default";

        showToast(t("walletConnected"));

        // Live block ticker
        provider.on("block", (num) => {
            const s = num.toLocaleString();
            blockNumEl.textContent = s;
            sBlockEl.textContent = s;
            flashStat(sBlockEl);
        });

        await refreshAll();
        startPolling();
        subscribeToEvents();

        window.ethereum.on("accountsChanged", () => location.reload());
        window.ethereum.on("chainChanged",    () => location.reload());
    } catch (err) {
        console.error(err);
        connectBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="13" rx="2.5"/><path d="M16 13h.01"/><path d="M22 10V8a2 2 0 0 0-2-2H5.5"/></svg> <span data-i18n="connectMetaMask">${t("connectMetaMask")}</span>`;
        showToast(t("connectFailed", errorText(err)), "err");
    }
}

// ---- Polling + events ------------------------------------------------------

function startPolling() {
    if (pollHandle) clearInterval(pollHandle);
    pollHandle = setInterval(refreshAll, 5000);
}

function subscribeToEvents() {
    contract.on("VoterRegistered", () => refreshAll());
    contract.on("VoteCommitted",   () => refreshAll());
    contract.on("VoteRevealed",    () => refreshAll());
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
        showToast(t("refreshFailed", errorText(err)), "err");
    }
}

function renderPhaseHeader(phaseNum, regDl, voteDl, revDl) {
    const name = t(PHASE_KEYS[phaseNum]);
    phaseEl.textContent = name;
    sPhaseEl.textContent = name;

    const now = Math.floor(Date.now() / 1000);
    const nextDeadline = phaseNum === 0 ? regDl : phaseNum === 1 ? voteDl : phaseNum === 2 ? revDl : 0;

    countdownEl.textContent = phaseNum === 3
        ? t("electionEnded")
        : t("phaseEndsIn", fmtCountdown(nextDeadline - now));

    // Update timeline steps
    timelineEl.style.setProperty("--progress", PHASE_PROGRESS[phaseNum]);
    for (let i = 0; i < 4; i++) {
        const step = $(`step-${i}`);
        const sub  = $(`sub-${i}`);
        step.className = "step " + (i < phaseNum ? "done" : i === phaseNum ? "current" : "future");
        sub.textContent = i < phaseNum ? t("subClosed") : i === phaseNum ? t("subLive") : t("subSoon");
    }
}

// ---- Phase body ------------------------------------------------------------

async function renderPhaseBody(phaseNum) {
    phaseBodyEl.innerHTML = "";

    if (phaseNum === 0) {
        phaseBodyEl.innerHTML = `<div class="card"><p class="muted">${t("registrationOpen")}</p></div>`;
        return;
    }
    if (phaseNum === 1) await renderVotingBody();
    if (phaseNum === 2) await renderRevealBody();
    if (phaseNum === 3) {
        phaseBodyEl.innerHTML = `<div class="card"><p class="muted">${t("electionEndedFinal")}</p></div>`;
    }
}

async function renderVotingBody() {
    const [isEligible, existing] = await Promise.all([
        contract.eligible(userAddress),
        contract.commitments(userAddress),
    ]);
    const alreadyCommitted = existing !== ethers.ZeroHash;

    if (!isEligible) {
        phaseBodyEl.innerHTML = `<div class="card"><p class="muted">${t("notEligible", userAddress)}</p></div>`;
        return;
    }

    if (alreadyCommitted) {
        phaseBodyEl.innerHTML = `<div class="card"><p class="muted">${t("voteCommittedMsg")}</p></div>`;
        return;
    }

    // Ballot heading
    const heading = document.createElement("h3");
    heading.style.cssText = "font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-3);font-weight:600;margin-bottom:16px;";
    heading.textContent = t("chooseCandidate");
    phaseBodyEl.appendChild(heading);

    // Fetch candidates + current votes for bars
    const candidates = await contract.getCandidates();
    const counts = await Promise.all(candidates.map((c) => contract.getVotes(c)));
    const total  = counts.reduce((s, v) => s + Number(v), 0);

    const grid = document.createElement("div");
    grid.className = "ballot-grid";
    currentVoteSelection = null;

    candidates.forEach((name, i) => {
        const count = Number(counts[i]);
        const pct   = total === 0 ? 0 : (count / total) * 100;
        const [from, to] = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
        const ini   = initials(name);

        const card = document.createElement("div");
        card.className = "candidate reveal";
        card.innerHTML = `
            <div class="cand-head">
                <div class="avatar" style="--ava-from:${from};--ava-to:${to}">${ini}</div>
                <div class="cand-body">
                    <div class="cand-name">${name}</div>
                    <div class="cand-handle">ticket #${String(i + 1).padStart(2, "0")}</div>
                </div>
                <div class="radio"></div>
            </div>
            <div class="cand-foot">
                <div class="bar-wrap"><div class="bar-fill" data-pct="${pct.toFixed(1)}"></div></div>
                <div class="pct">${pct.toFixed(0)}%</div>
            </div>`;

        card.addEventListener("mousemove", (e) => {
            const r = card.getBoundingClientRect();
            card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
            card.style.setProperty("--my", ((e.clientY - r.top)  / r.height * 100) + "%");
        });

        card.addEventListener("click", () => {
            grid.querySelectorAll(".candidate").forEach((c) => c.classList.remove("selected"));
            card.classList.add("selected");
            currentVoteSelection = name;
            const selEl = document.getElementById("selection");
            if (selEl) { selEl.textContent = name; selEl.classList.remove("muted"); }
            const subBtn = document.getElementById("submit");
            if (subBtn) { subBtn.disabled = false; subBtn.style.opacity = "1"; subBtn.style.cursor = "pointer"; }
        });

        grid.appendChild(card);
        setTimeout(() => {
            const bar = card.querySelector(".bar-fill");
            if (bar) bar.style.width = bar.dataset.pct + "%";
            card.classList.add("in");
        }, 200 + i * 80);
    });

    // Action card: selection + submit
    const actionCard = document.createElement("div");
    actionCard.className = "card";
    actionCard.style.marginTop = "22px";
    actionCard.innerHTML = `
        <div class="card-row">
            <div>
                <div class="field-label">${t("yourSelection")}</div>
                <div class="field-value muted" id="selection">— ${t("selectAbove")} —</div>
            </div>
            <button class="btn" id="submit" disabled style="opacity:0.5;cursor:not-allowed;">
                <span>${t("submitVote")}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
        </div>
        <div class="receipt" id="receipt" style="display:none;"></div>`;

    phaseBodyEl.appendChild(grid);
    phaseBodyEl.appendChild(actionCard);

    document.getElementById("submit").addEventListener("click", () => {
        if (!currentVoteSelection) return;
        const btn = document.getElementById("submit");
        commitVote(currentVoteSelection, btn);
    });
}

async function renderRevealBody() {
    const commitment = await contract.commitments(userAddress);
    if (commitment === ethers.ZeroHash) {
        phaseBodyEl.innerHTML = `<div class="card"><p class="muted">${t("noCommitment")}</p></div>`;
        return;
    }
    const revealed = await contract.hasRevealed(userAddress);
    if (revealed) {
        phaseBodyEl.innerHTML = `<div class="card"><p class="muted success">${t("alreadyRevealed")}</p></div>`;
        return;
    }
    const ballot = loadBallot(userAddress);
    if (!ballot) {
        phaseBodyEl.innerHTML = `<div class="card"><p class="muted error">${t("noNonce")}</p></div>`;
        return;
    }

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <div class="card-row">
            <div>
                <div class="field-label">${t("yourSelection")}</div>
                <p style="margin-top:8px;">${t("committedVoteFor", ballot.candidate)}</p>
            </div>
            <button class="btn" id="reveal-btn">
                <span>${t("revealVoteFor", ballot.candidate)}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
        </div>`;
    phaseBodyEl.appendChild(card);

    document.getElementById("reveal-btn").addEventListener("click", (e) => {
        revealVote(ballot, e.currentTarget);
    });
}

// ---- Vote actions ----------------------------------------------------------

async function commitVote(candidate, button) {
    button.disabled = true;
    button.innerHTML = `<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.2-8.5"/></svg> ${t("committingVote", candidate)}`;
    try {
        const nonce      = randomNonce();
        const commitment = makeCommitment(candidate, nonce);
        saveBallot(userAddress, candidate, nonce);

        showToast(t("committingVote", candidate));
        const tx = await contract.commitVote(commitment);
        showToast(t("txSent", tx.hash.slice(0, 10)));
        const receipt = await tx.wait();

        // Show receipt
        const receiptEl = document.getElementById("receipt");
        if (receiptEl) {
            receiptEl.style.display = "grid";
            receiptEl.innerHTML = `
                <span class="k">tx</span>
                <span class="v">${tx.hash.slice(0, 14)}…${tx.hash.slice(-6)}</span>
                <span class="verify-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>verified</span>
                <span class="k">block</span>
                <span class="v">#${receipt.blockNumber.toLocaleString()}</span>
                <span></span>`;
        }

        showToast(t("voteCommittedSuccess"));
        await refreshAll();
    } catch (err) {
        console.error(err);
        const onchain = await contract.commitments(userAddress).catch(() => ethers.ZeroHash);
        if (onchain === ethers.ZeroHash) clearBallot(userAddress);
        showToast(t("commitFailed", errorText(err)), "err");
        button.disabled = false;
        button.innerHTML = `<span>${t("submitVote")}</span> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>`;
    }
}

async function revealVote(ballot, button) {
    button.disabled = true;
    button.innerHTML = `<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.2-8.5"/></svg> ${t("revealingVote", ballot.candidate)}`;
    try {
        showToast(t("revealingVote", ballot.candidate));
        const tx = await contract.revealVote(ballot.candidate, ballot.nonce);
        showToast(t("txSent", tx.hash.slice(0, 10)));
        await tx.wait();
        showToast(t("voteRevealedSuccess"));
        clearBallot(userAddress);
        await refreshAll();
    } catch (err) {
        console.error(err);
        showToast(t("revealFailed", errorText(err)), "err");
        button.disabled = false;
        button.innerHTML = `<span>${t("revealVoteFor", ballot.candidate)}</span>`;
    }
}

// ---- Results ---------------------------------------------------------------

async function renderResults() {
    const candidates = await contract.getCandidates();
    const counts     = await Promise.all(candidates.map((c) => contract.getVotes(c)));
    const total      = counts.reduce((s, v) => s + Number(v), 0);

    // Update strip
    sVotesEl.textContent = total.toLocaleString();
    flashStat(sVotesEl);

    // Results list
    resultsListEl.innerHTML = "";
    candidates.forEach((name, i) => {
        const count = Number(counts[i]);
        const pct   = total === 0 ? 0 : (count / total) * 100;
        const li    = document.createElement("li");
        li.style.setProperty("--pct", pct + "%");
        li.textContent = t("resultsLine", name, count, pct.toFixed(0));
        resultsListEl.appendChild(li);
    });
}

// ---- Admin panel -----------------------------------------------------------

async function renderAdminPanel(phaseNum) {
    if (!isAdmin) { adminPanelEl.style.display = "none"; return; }
    adminPanelEl.style.display = "block";
    adminPanelEl.innerHTML = "";

    const head = document.createElement("div");
    head.className = "section-head";
    head.style.marginTop = "0";
    head.innerHTML = `<h2>${t("adminPanel")}</h2>`;
    adminPanelEl.appendChild(head);

    if (phaseNum !== 0) {
        adminPanelEl.innerHTML += `<p class="muted">${t("registrationClosed")}</p>`;
        return;
    }

    const help = document.createElement("p");
    help.className = "muted";
    help.innerHTML = t("addVotersHelp");
    adminPanelEl.appendChild(help);

    const textarea = document.createElement("textarea");
    textarea.placeholder = "0x1234…\n0xabcd…";
    textarea.rows = 5;
    adminPanelEl.appendChild(textarea);

    const btn = document.createElement("button");
    btn.className = "btn";
    btn.style.marginTop = "4px";
    btn.textContent = t("registerVoters");
    btn.addEventListener("click", () => registerVoters(textarea, btn));
    adminPanelEl.appendChild(btn);
}

async function registerVoters(textarea, button) {
    const lines = textarea.value.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    const valid = [];
    for (const line of lines) {
        try { valid.push(ethers.getAddress(line)); }
        catch { showToast(t("invalidAddress", line), "err"); return; }
    }
    if (valid.length === 0) { showToast(t("enterAtLeastOne"), "err"); return; }

    button.disabled = true;
    try {
        showToast(t("registering", valid.length));
        const tx = valid.length === 1
            ? await contract.registerVoter(valid[0])
            : await contract.registerVoters(valid);
        await tx.wait();
        showToast(t("votersRegistered"));
        textarea.value = "";
        await refreshAll();
    } catch (err) {
        console.error(err);
        showToast(t("registrationFailed", errorText(err)), "err");
    } finally {
        button.disabled = false;
    }
}

// ---- Reveal animations on scroll ------------------------------------------

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
        if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add("in"), i * 60);
            revealObserver.unobserve(e.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// ---- Boot ------------------------------------------------------------------

// Theme
const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

$("theme-toggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
});

// Language
const langEl = $("lang");
langEl.querySelectorAll("button").forEach((btn) => {
    if (btn.dataset.lang === currentLang) btn.classList.add("active");
    btn.addEventListener("click", () => {
        if (btn.dataset.lang === currentLang) return;
        currentLang = btn.dataset.lang;
        localStorage.setItem("lang", currentLang);
        langEl.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.lang === currentLang));
        langEl.classList.toggle("id", currentLang === "id");
        applyLang();
    });
});
langEl.classList.toggle("id", currentLang === "id");

// Palette
document.querySelectorAll(".swatch").forEach((sw) => {
    sw.addEventListener("click", () => {
        document.querySelectorAll(".swatch").forEach((x) => x.classList.remove("active"));
        sw.classList.add("active");
        document.documentElement.dataset.palette = sw.dataset.palette;
        localStorage.setItem("palette", sw.dataset.palette);
    });
    if (sw.dataset.palette === (localStorage.getItem("palette") || "emerald")) {
        sw.classList.add("active");
        document.documentElement.dataset.palette = sw.dataset.palette;
    }
});

$("tweaks-close").addEventListener("click", () => { $("tweaks").style.display = "none"; });

// Connect
connectBtn.addEventListener("click", connect);

// Apply initial language
applyLang();
