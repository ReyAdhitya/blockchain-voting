import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VotingModule = buildModule("VotingModule", (m) => {
    const candidates = ["Alice", "Bob", "Charlie"];

    const voting = m.contract("Voting", [candidates]);

    return { voting };

});

export default VotingModule;