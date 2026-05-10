import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Hardhat Ignition module for the Election contract.
// Tweak the parameters below or override them at deploy time:
//   npx hardhat ignition deploy ignition/modules/Election.ts \
//     --parameters '{"ElectionModule":{"registrationSeconds":3600,...}}'

const ElectionModule = buildModule("ElectionModule", (m) => {
    const candidates = m.getParameter("candidates", ["Alice", "Bob", "Charlie"]);

    // Defaults are short for local testing. For a real student council vote
    // you might want days, e.g. 86400 * 2 (two days).
    const registrationSeconds = m.getParameter("registrationSeconds", 600);   // 10 min
    const votingSeconds       = m.getParameter("votingSeconds",       1200);  // 20 min
    const revealSeconds       = m.getParameter("revealSeconds",       600);   // 10 min

    const election = m.contract("Election", [
        candidates,
        registrationSeconds,
        votingSeconds,
        revealSeconds,
    ]);

    return { election };
});

export default ElectionModule;
