// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title CivicVerifier
 * @dev Contract module for verifying Civic Pass ownership and restricting access to functions
 */
interface ICivicPass {
    function isValid(address _addr) external view returns (bool);
}

contract CivicVerifier {
    ICivicPass public civicPass;
    
    event CivicPassUpdated(address indexed oldPass, address indexed newPass);
    
    /**
     * @dev Initializes the contract with a Civic Pass contract address
     */
    constructor(address _civicPassAddress) {
        civicPass = ICivicPass(_civicPassAddress);
    }
    
    /**
     * @dev Updates the Civic Pass contract address
     * @param _newCivicPassAddress The new Civic Pass contract address
     */
    function updateCivicPass(address _newCivicPassAddress) external {
        address oldPass = address(civicPass);
        civicPass = ICivicPass(_newCivicPassAddress);
        emit CivicPassUpdated(oldPass, _newCivicPassAddress);
    }
    
    /**
     * @dev Modifier to restrict access to functions to verified Civic Pass holders
     */
    modifier onlyCivicVerified() {
        require(civicPass.isValid(msg.sender), "CivicVerifier: Sender not verified");
        _;
    }
    
    /**
     * @dev Checks if an address is verified with Civic Pass
     * @param _address Address to check
     * @return bool True if address has a valid Civic Pass
     */
    function isVerified(address _address) public view returns (bool) {
        return civicPass.isValid(_address);
    }
}
