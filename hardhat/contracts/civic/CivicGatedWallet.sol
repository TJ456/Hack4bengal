// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./CivicVerifier.sol";

/**
 * @title CivicGatedWallet
 * @dev Implements a wallet contract with Civic Pass verification for high-value transactions
 */
contract CivicGatedWallet is CivicVerifier {
    uint256 public verificationThreshold;
    address public owner;
    
    event TransactionExecuted(address indexed to, uint256 value, bool verified);
    event ThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    
    /**
     * @dev Initializes the contract with Civic Pass and a threshold amount
     * @param _civicPassAddress The Civic Pass contract address
     * @param _threshold Threshold amount above which Civic verification is required
     */
    constructor(address _civicPassAddress, uint256 _threshold) 
        CivicVerifier(_civicPassAddress) 
    {
        verificationThreshold = _threshold;
        owner = msg.sender;
    }
    
    /**
     * @dev Modifier to restrict access to the owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "CivicGatedWallet: Not owner");
        _;
    }
    
    /**
     * @dev Updates the threshold amount for Civic verification
     * @param _newThreshold New threshold amount
     */
    function updateThreshold(uint256 _newThreshold) external onlyOwner {
        uint256 oldThreshold = verificationThreshold;
        verificationThreshold = _newThreshold;
        emit ThresholdUpdated(oldThreshold, _newThreshold);
    }
    
    /**
     * @dev Executes a transaction, requiring Civic verification for amounts above threshold
     * @param _to Recipient address
     * @param _value Transaction amount
     * @return success Whether the transaction was successful
     */
    function executeTransaction(address payable _to, uint256 _value) external returns (bool success) {
        require(_to != address(0), "CivicGatedWallet: Invalid recipient");
        
        bool requiresVerification = _value >= verificationThreshold;
        
        if (requiresVerification) {
            require(civicPass.isValid(msg.sender), "CivicGatedWallet: Civic verification required for high-value transaction");
        }
        
        (success, ) = _to.call{value: _value}("");
        require(success, "CivicGatedWallet: Transaction failed");
        
        emit TransactionExecuted(_to, _value, requiresVerification);
        
        return success;
    }
    
    /**
     * @dev Allows the contract to receive ETH
     */
    receive() external payable {}
}
