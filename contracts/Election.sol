// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Student Council Election with commit-reveal voting
/// @notice Demonstrates a real-world voting flow: whitelist, time windows,
///         and ballot secrecy via commit-reveal. NOT coercion-resistant —
///         see README for the limits of this design.
contract Election {
    enum Phase { Registration, Voting, Reveal, Ended }

    address public immutable admin;
    string[] public candidates;

    // Voter state
    mapping(address => bool) public eligible;
    mapping(address => bytes32) public commitments;   // 0x00…00 means "no commit"
    mapping(address => bool) public hasRevealed;

    // Vote tally — only updated during reveals
    mapping(string => uint256) private voteCount;

    // Timestamps that gate the phases (set in constructor, immutable schedule)
    uint256 public immutable registrationDeadline;
    uint256 public immutable votingDeadline;
    uint256 public immutable revealDeadline;

    event VoterRegistered(address indexed voter);
    event VoteCommitted(address indexed voter);
    event VoteRevealed(address indexed voter, string candidate);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Election: not admin");
        _;
    }

    /// @param _candidates list of candidate names (>= 2)
    /// @param _registrationSeconds length of the registration window (from deployment)
    /// @param _votingSeconds       length of the voting window (after registration)
    /// @param _revealSeconds       length of the reveal window (after voting)
    constructor(
        string[] memory _candidates,
        uint256 _registrationSeconds,
        uint256 _votingSeconds,
        uint256 _revealSeconds
    ) {
        require(_candidates.length >= 2, "Election: need >= 2 candidates");
        require(_registrationSeconds > 0 && _votingSeconds > 0 && _revealSeconds > 0,
            "Election: all phases must be > 0");

        admin = msg.sender;
        candidates = _candidates;
        registrationDeadline = block.timestamp + _registrationSeconds;
        votingDeadline       = registrationDeadline + _votingSeconds;
        revealDeadline       = votingDeadline + _revealSeconds;
    }

    // ---- Phase introspection -------------------------------------------------

    function currentPhase() public view returns (Phase) {
        if (block.timestamp < registrationDeadline) return Phase.Registration;
        if (block.timestamp < votingDeadline)       return Phase.Voting;
        if (block.timestamp < revealDeadline)       return Phase.Reveal;
        return Phase.Ended;
    }

    function getCandidates() external view returns (string[] memory) {
        return candidates;
    }

    function candidatesCount() external view returns (uint256) {
        return candidates.length;
    }

    // ---- Registration --------------------------------------------------------

    /// Register a single voter. Admin only, registration phase only.
    function registerVoter(address voter) external onlyAdmin {
        require(currentPhase() == Phase.Registration, "Election: registration closed");
        require(voter != address(0), "Election: zero address");
        require(!eligible[voter], "Election: already registered");
        eligible[voter] = true;
        emit VoterRegistered(voter);
    }

    /// Bulk-register voters (e.g. importing a class roster). Skips duplicates.
    function registerVoters(address[] calldata voters) external onlyAdmin {
        require(currentPhase() == Phase.Registration, "Election: registration closed");
        for (uint256 i = 0; i < voters.length; i++) {
            address v = voters[i];
            if (v != address(0) && !eligible[v]) {
                eligible[v] = true;
                emit VoterRegistered(v);
            }
        }
    }

    // ---- Commit (vote secretly) ---------------------------------------------

    /// Submit `keccak256(abi.encode(candidate, nonce))`. The candidate name
    /// is not revealed; an attacker watching the chain only sees the hash.
    function commitVote(bytes32 commitment) external {
        require(currentPhase() == Phase.Voting, "Election: not voting phase");
        require(eligible[msg.sender], "Election: not eligible");
        require(commitments[msg.sender] == bytes32(0), "Election: already committed");
        require(commitment != bytes32(0), "Election: invalid commitment");
        commitments[msg.sender] = commitment;
        emit VoteCommitted(msg.sender);
    }

    // ---- Reveal --------------------------------------------------------------

    /// Reveal the candidate + nonce that was hashed earlier. The contract
    /// re-hashes them and accepts the vote only if it matches the commitment.
    function revealVote(string calldata candidate, bytes32 nonce) external {
        require(currentPhase() == Phase.Reveal, "Election: not reveal phase");
        bytes32 commitment = commitments[msg.sender];
        require(commitment != bytes32(0), "Election: nothing to reveal");
        require(!hasRevealed[msg.sender], "Election: already revealed");
        require(_isValidCandidate(candidate), "Election: unknown candidate");

        bytes32 expected = keccak256(abi.encode(candidate, nonce));
        require(expected == commitment, "Election: reveal does not match commit");

        hasRevealed[msg.sender] = true;
        voteCount[candidate]++;
        emit VoteRevealed(msg.sender, candidate);
    }

    // ---- Tally ---------------------------------------------------------------

    /// Live during the reveal phase, final once Ended.
    function getVotes(string calldata candidate) external view returns (uint256) {
        return voteCount[candidate];
    }

    // ---- Internals -----------------------------------------------------------

    function _isValidCandidate(string memory candidate) internal view returns (bool) {
        bytes32 target = keccak256(bytes(candidate));
        for (uint256 i = 0; i < candidates.length; i++) {
            if (keccak256(bytes(candidates[i])) == target) return true;
        }
        return false;
    }
}
