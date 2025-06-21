// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title MockCivicPass
 * @dev Mock contract for testing Civic Pass integration
 */
contract MockCivicPass {
    mapping(address => bool) private validAddresses;
    
    event AddressValidityUpdated(address indexed user, bool isValid);
    
    /**
     * @dev Constructor sets the deployer as valid by default
     */
    constructor() {
        validAddresses[msg.sender] = true;
    }
    
    /**
     * @dev Checks if an address is valid
     * @param _addr Address to check
     * @return bool True if address is valid
     */
    function isValid(address _addr) external view returns (bool) {
        return validAddresses[_addr];
    }
    
    /**
     * @dev Sets the validity of an address
     * @param _addr Address to update
     * @param _isValid New validity value
     */
    function setValidity(address _addr, bool _isValid) external {
        validAddresses[_addr] = _isValid;
        emit AddressValidityUpdated(_addr, _isValid);
    }
}
