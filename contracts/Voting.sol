// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Voting{
        string[] public candidateList;
        mapping(string => uint) public votesReceived;
        mapping(address => bool) public hasVoted;
    
        constructor(string[] memory _candidates) {
                candidateList = _candidates;
        }

        function castVote(string memory _candidate) public {
            // check if wallet has already voted, stop them if they have
            require(!hasVoted[msg.sender], "You have already voted.");
            votesReceived[_candidate]++;
            hasVoted[msg.sender] = true;
        }
        
        function getVotes(string memory _candidate) public view returns (uint) {
                return votesReceived[_candidate];
        }
}
