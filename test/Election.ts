import { expect } from "chai";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const REG_SECS = 60;       // 1 min registration
const VOTE_SECS = 120;     // 2 min voting
const REVEAL_SECS = 60;    // 1 min reveal

const CANDIDATES = ["Alice", "Bob", "Charlie"];

// Helpers ---------------------------------------------------------------------

async function deployElectionFixture() {
    const admin = await provider.getSigner(0);
    const artifact = await import(
        "../artifacts/contracts/Election.sol/Election.json",
        { assert: { type: "json" } }
    );
    const factory = new ethers.ContractFactory(
        artifact.default.abi,
        artifact.default.bytecode,
        admin
    );
    const election = await factory.deploy(
        CANDIDATES, REG_SECS, VOTE_SECS, REVEAL_SECS
    ) as any;
    await election.waitForDeployment();

    const voter1 = await provider.getSigner(1);
    const voter2 = await provider.getSigner(2);
    const voter3 = await provider.getSigner(3);
    const stranger = await provider.getSigner(4);

    return { election, admin, voter1, voter2, voter3, stranger };
}

async function advanceTime(seconds: number) {
    await provider.send("evm_increaseTime", [seconds]);
    await provider.send("evm_mine", []);
}

function makeCommitment(candidate: string, nonce: string): string {
    return ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ["string", "bytes32"], [candidate, nonce]
        )
    );
}

function randomNonce(): string {
    return ethers.hexlify(ethers.randomBytes(32));
}

// Tests -----------------------------------------------------------------------

describe("Election", function () {

    it("Deploys with correct candidates and admin", async function () {
        const { election, admin } = await deployElectionFixture();
        expect(await election.admin()).to.equal(await admin.getAddress());
        expect(await election.candidatesCount()).to.equal(3n);
        expect(await election.candidates(0)).to.equal("Alice");
    });

    it("Starts in Registration phase", async function () {
        const { election } = await deployElectionFixture();
        expect(await election.currentPhase()).to.equal(0n); // Registration
    });

    it("Admin can register voters; non-admin cannot", async function () {
        const { election, voter1, stranger } = await deployElectionFixture();

        await election.registerVoter(await voter1.getAddress());
        expect(await election.eligible(await voter1.getAddress())).to.equal(true);

        const electionAsStranger = election.connect(stranger);
        try {
            await electionAsStranger.registerVoter(await stranger.getAddress());
            expect.fail("Stranger should not be allowed to register voters");
        } catch (err: any) {
            expect(err.message).to.include("not admin");
        }
    });

    it("Bulk registration skips duplicates and zero address", async function () {
        const { election, voter1, voter2 } = await deployElectionFixture();
        const a1 = await voter1.getAddress();
        const a2 = await voter2.getAddress();
        await election.registerVoters([a1, a2, a1, ethers.ZeroAddress]);
        expect(await election.eligible(a1)).to.equal(true);
        expect(await election.eligible(a2)).to.equal(true);
    });

    it("Cannot commit during Registration phase", async function () {
        const { election, voter1 } = await deployElectionFixture();
        await election.registerVoter(await voter1.getAddress());

        const commitment = makeCommitment("Alice", randomNonce());
        try {
            await election.connect(voter1).commitVote(commitment);
            expect.fail("Should not allow commit during registration");
        } catch (err: any) {
            expect(err.message).to.include("not voting phase");
        }
    });

    it("Eligible voter can commit during Voting phase; ineligible cannot", async function () {
        const { election, voter1, stranger } = await deployElectionFixture();
        await election.registerVoter(await voter1.getAddress());

        await advanceTime(REG_SECS + 1); // → Voting
        expect(await election.currentPhase()).to.equal(1n);

        const commitment = makeCommitment("Alice", randomNonce());
        await election.connect(voter1).commitVote(commitment);
        expect(await election.commitments(await voter1.getAddress())).to.equal(commitment);

        try {
            await election.connect(stranger).commitVote(commitment);
            expect.fail("Stranger should not be eligible");
        } catch (err: any) {
            expect(err.message).to.include("not eligible");
        }
    });

    it("Cannot commit twice", async function () {
        const { election, voter1 } = await deployElectionFixture();
        await election.registerVoter(await voter1.getAddress());
        await advanceTime(REG_SECS + 1);

        const c1 = makeCommitment("Alice", randomNonce());
        const c2 = makeCommitment("Bob", randomNonce());
        await election.connect(voter1).commitVote(c1);

        try {
            await election.connect(voter1).commitVote(c2);
            expect.fail("Should reject second commit");
        } catch (err: any) {
            expect(err.message).to.include("already committed");
        }
    });

    it("Reveal succeeds with matching nonce, increments tally", async function () {
        const { election, voter1 } = await deployElectionFixture();
        await election.registerVoter(await voter1.getAddress());

        await advanceTime(REG_SECS + 1);
        const nonce = randomNonce();
        await election.connect(voter1).commitVote(makeCommitment("Alice", nonce));

        await advanceTime(VOTE_SECS + 1); // → Reveal
        expect(await election.currentPhase()).to.equal(2n);

        await election.connect(voter1).revealVote("Alice", nonce);
        expect(await election.getVotes("Alice")).to.equal(1n);
        expect(await election.hasRevealed(await voter1.getAddress())).to.equal(true);
    });

    it("Reveal fails with wrong candidate (commitment mismatch)", async function () {
        const { election, voter1 } = await deployElectionFixture();
        await election.registerVoter(await voter1.getAddress());

        await advanceTime(REG_SECS + 1);
        const nonce = randomNonce();
        await election.connect(voter1).commitVote(makeCommitment("Alice", nonce));

        await advanceTime(VOTE_SECS + 1);

        try {
            await election.connect(voter1).revealVote("Bob", nonce);
            expect.fail("Should reject mismatched reveal");
        } catch (err: any) {
            expect(err.message).to.include("does not match commit");
        }
    });

    it("Cannot reveal during Voting phase", async function () {
        const { election, voter1 } = await deployElectionFixture();
        await election.registerVoter(await voter1.getAddress());
        await advanceTime(REG_SECS + 1);
        const nonce = randomNonce();
        await election.connect(voter1).commitVote(makeCommitment("Alice", nonce));

        try {
            await election.connect(voter1).revealVote("Alice", nonce);
            expect.fail("Should reject reveal during voting");
        } catch (err: any) {
            expect(err.message).to.include("not reveal phase");
        }
    });

    it("Full end-to-end: 3 voters, 3 candidates, correct tally", async function () {
        const { election, voter1, voter2, voter3 } = await deployElectionFixture();
        const a1 = await voter1.getAddress();
        const a2 = await voter2.getAddress();
        const a3 = await voter3.getAddress();
        await election.registerVoters([a1, a2, a3]);

        await advanceTime(REG_SECS + 1);

        const n1 = randomNonce();
        const n2 = randomNonce();
        const n3 = randomNonce();
        await election.connect(voter1).commitVote(makeCommitment("Alice", n1));
        await election.connect(voter2).commitVote(makeCommitment("Alice", n2));
        await election.connect(voter3).commitVote(makeCommitment("Bob", n3));

        await advanceTime(VOTE_SECS + 1);

        await election.connect(voter1).revealVote("Alice", n1);
        await election.connect(voter2).revealVote("Alice", n2);
        await election.connect(voter3).revealVote("Bob", n3);

        expect(await election.getVotes("Alice")).to.equal(2n);
        expect(await election.getVotes("Bob")).to.equal(1n);
        expect(await election.getVotes("Charlie")).to.equal(0n);
    });
});
