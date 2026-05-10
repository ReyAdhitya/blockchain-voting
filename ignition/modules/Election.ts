import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Hardhat Ignition module for the Election contract.
// Tweak the parameters below or override them at deploy time:
//   npx hardhat ignition deploy ignition/modules/Election.ts \
//     --parameters '{"ElectionModule":{"registrationSeconds":3600,...}}'

const ElectionModule = buildModule("ElectionModule", (m) => {
    const candidates = m.getParameter("candidates", ["Alice", "Bob", "Charlie"]);

    // Defaults give comfortable testing windows on Sepolia. For a real
    // student council vote you'd want days — 86400 * 2 = two days, etc.
    const registrationSeconds = m.getParameter("registrationSeconds", 3600);   // 1 hour
    const votingSeconds       = m.getParameter("votingSeconds",       7200);   // 2 hours
    const revealSeconds       = m.getParameter("revealSeconds",       3600);   // 1 hour

    const election = m.contract("Election", [
        candidates,
        registrationSeconds,
        votingSeconds,
        revealSeconds,
    ]);

    return { election };
});

export default ElectionModule;
