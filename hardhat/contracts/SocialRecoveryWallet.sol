// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SocialRecoveryWallet is Ownable, ReentrancyGuard {
    // Constants
    uint256 public immutable RECOVERY_DELAY = 3 days;
    uint256 public immutable GUARDIAN_THRESHOLD;

    // Structs
    struct RecoveryRequest {
        address proposedOwner;
        uint256 initiationTime;
        uint256 approvals;
        bool executed;
        mapping(address => bool) hasApproved;
    }

    // State variables
    mapping(address => bool) public isGuardian;
    mapping(uint256 => RecoveryRequest) public recoveryRequests;
    uint256 public guardianCount;
    uint256 public recoveryRequestCount;

    // Events
    event GuardianAdded(address indexed guardian);
    event GuardianRemoved(address indexed guardian);
    event RecoveryInitiated(uint256 indexed requestId, address indexed proposedOwner);
    event RecoveryApproved(uint256 indexed requestId, address indexed guardian);
    event RecoveryExecuted(uint256 indexed requestId, address indexed oldOwner, address indexed newOwner);
    event RecoveryCancelled(uint256 indexed requestId);

    constructor(uint256 _threshold) {
        require(_threshold > 0, "Threshold must be greater than 0");
        GUARDIAN_THRESHOLD = _threshold;
    }

    // Guardian Management
    function addGuardian(address _guardian) external onlyOwner {
        require(_guardian != address(0), "Invalid guardian address");
        require(!isGuardian[_guardian], "Already a guardian");
        
        isGuardian[_guardian] = true;
        guardianCount++;
        
        emit GuardianAdded(_guardian);
    }

    function removeGuardian(address _guardian) external onlyOwner {
        require(isGuardian[_guardian], "Not a guardian");
        
        isGuardian[_guardian] = false;
        guardianCount--;
        
        emit GuardianRemoved(_guardian);
    }

    // Recovery Process
    function initiateRecovery(address _proposedOwner) external {
        require(isGuardian[msg.sender], "Only guardians can initiate recovery");
        require(_proposedOwner != address(0), "Invalid proposed owner");
        
        uint256 requestId = recoveryRequestCount++;
        RecoveryRequest storage request = recoveryRequests[requestId];
        
        request.proposedOwner = _proposedOwner;
        request.initiationTime = block.timestamp;
        request.approvals = 1;
        request.hasApproved[msg.sender] = true;
        
        emit RecoveryInitiated(requestId, _proposedOwner);
    }

    function approveRecovery(uint256 _requestId) external {
        require(isGuardian[msg.sender], "Only guardians can approve recovery");
        
        RecoveryRequest storage request = recoveryRequests[_requestId];
        require(!request.executed, "Recovery already executed");
        require(!request.hasApproved[msg.sender], "Guardian has already approved");
        
        request.approvals++;
        request.hasApproved[msg.sender] = true;
        
        emit RecoveryApproved(_requestId, msg.sender);

        // Execute recovery if threshold met and delay passed
        if (request.approvals >= GUARDIAN_THRESHOLD && 
            block.timestamp >= request.initiationTime + RECOVERY_DELAY) {
            _executeRecovery(_requestId);
        }
    }

    function cancelRecovery(uint256 _requestId) external onlyOwner {
        RecoveryRequest storage request = recoveryRequests[_requestId];
        require(!request.executed, "Recovery already executed");
        
        delete recoveryRequests[_requestId];
        emit RecoveryCancelled(_requestId);
    }

    // Internal Functions
    function _executeRecovery(uint256 _requestId) internal nonReentrant {
        RecoveryRequest storage request = recoveryRequests[_requestId];
        require(!request.executed, "Recovery already executed");
        require(request.approvals >= GUARDIAN_THRESHOLD, "Insufficient approvals");
        require(block.timestamp >= request.initiationTime + RECOVERY_DELAY, "Delay not met");

        address oldOwner = owner();
        request.executed = true;
        _transferOwnership(request.proposedOwner);
        
        emit RecoveryExecuted(_requestId, oldOwner, request.proposedOwner);
    }

    // View Functions
    function getRecoveryRequest(uint256 _requestId) external view returns (
        address proposedOwner,
        uint256 initiationTime,
        uint256 approvals,
        bool executed
    ) {
        RecoveryRequest storage request = recoveryRequests[_requestId];
        return (
            request.proposedOwner,
            request.initiationTime,
            request.approvals,
            request.executed
        );
    }
}
