import { expect } from "chai";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

describe("Voting", function () {
    async function deployVotingFixture() {
        const candidates = ["Alice", "Bob", "Charlie"];
        
        const signer = await provider.getSigner(0);
        
        const artifact = await import("../artifacts/contracts/Voting.sol/Voting.json", { assert: { type: "json" } });
        
        const factory = new ethers.ContractFactory(artifact.default.abi, artifact.default.bytecode, signer);
        const voting = await factory.deploy(candidates) as any;
        await voting.waitForDeployment();
        
        return { voting, candidates, signer };
    }

    it("Should deploy with correct candidates", async function () {
        const { voting } = await deployVotingFixture();
        const first = await voting.candidateList(0);
        expect(first).to.equal("Alice");
    });
    
    it("Should cast a vot successfuly", async function () {
        const { voting } = await deployVotingFixture();
        await voting.castVote("Alice");
        const votes = await voting.getVotes("Alice");
        expect(votes).to.equal(1n);
    });
    
    it("Should not allow double voting", async function () {
        const { voting } = await deployVotingFixture();
        await voting.castVote("Alice");
        try {
            await voting.castVote("Alice");
            expect.fail("Should have thrown an error");
        } catch (error: any) {
            expect(error.message).to.include("You have already voted");
        }
    });

});