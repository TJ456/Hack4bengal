// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CivicVerifier
 * @dev Contract module for verifying Civic Pass ownership, managing SBTs, and restricting access to functions
 */
interface ICivicPass {
    function isValid(address _addr) external view returns (bool);
}

interface ICivicSBT {
    function mint(uint256 verificationLevel, uint256 trustScore, uint256 votingAccuracy, uint256 doiParticipation) external returns (uint256);
    function updateMetadata(address holder, uint256 verificationLevel, uint256 trustScore, uint256 votingAccuracy, uint256 doiParticipation) external;
    function hasSBT(address owner) external view returns (bool);
}

contract CivicVerifier {
    ICivicPass public civicPass;
    ICivicSBT public sbtContract;
    
    event CivicPassUpdated(address indexed oldPass, address indexed newPass);
    event SBTContractUpdated(address indexed oldSBT, address indexed newSBT);
    event UserVerified(address indexed user, uint256 verificationLevel);
    
    struct UserVerification {
        bool isVerified;
        uint256 verificationLevel;
        uint256 timestamp;
        uint256 trustScore;
        uint256 votingAccuracy;
        uint256 doiParticipation;
    }
    
    mapping(address => UserVerification) private userVerifications;
    
    /**
     * @dev Initializes the contract with Civic Pass and SBT contract addresses
     */
    constructor(address _civicPassAddress, address _sbtAddress) {
        civicPass = ICivicPass(_civicPassAddress);
        sbtContract = ICivicSBT(_sbtAddress);
    }

    /**
     * @dev Update the Civic Pass contract address
     */
    function updateCivicPass(address _newCivicPass) external {
        require(_newCivicPass != address(0), "Invalid CivicPass address");
        address oldPass = address(civicPass);
        civicPass = ICivicPass(_newCivicPass);
        emit CivicPassUpdated(oldPass, _newCivicPass);
    }

    /**
     * @dev Update the SBT contract address
     */
    function updateSBTContract(address _newSBT) external {
        require(_newSBT != address(0), "Invalid SBT address");
        address oldSBT = address(sbtContract);
        sbtContract = ICivicSBT(_newSBT);
        emit SBTContractUpdated(oldSBT, _newSBT);
    }

    /**
     * @dev Check if an address is verified through Civic Pass
     */
    function isVerified(address _userAddress) public view returns (bool) {
        return userVerifications[_userAddress].isVerified && civicPass.isValid(_userAddress);
    }

    /**
     * @dev Get user's verification level (0 = none, 1 = low, 2 = medium, 3 = high)
     */
    function getVerificationLevel(address _userAddress) public view returns (uint256) {
        if (!isVerified(_userAddress)) return 0;
        return userVerifications[_userAddress].verificationLevel;
    }

    /**
     * @dev Register or update a user's verification status and mint/update SBT
     */
    function registerVerification(
        address _userAddress,
        uint256 _verificationLevel,
        uint256 _trustScore,
        uint256 _votingAccuracy,
        uint256 _doiParticipation
    ) external {
        require(civicPass.isValid(_userAddress), "User not verified by CivicPass");
        require(_verificationLevel > 0 && _verificationLevel <= 3, "Invalid verification level");

        userVerifications[_userAddress] = UserVerification({
            isVerified: true,
            verificationLevel: _verificationLevel,
            timestamp: block.timestamp,
            trustScore: _trustScore,
            votingAccuracy: _votingAccuracy,
            doiParticipation: _doiParticipation
        });

        // Mint or update SBT
        if (!sbtContract.hasSBT(_userAddress)) {
            sbtContract.mint(_verificationLevel, _trustScore, _votingAccuracy, _doiParticipation);
        } else {
            sbtContract.updateMetadata(_userAddress, _verificationLevel, _trustScore, _votingAccuracy, _doiParticipation);
        }

        emit UserVerified(_userAddress, _verificationLevel);
    }

    /**
     * @dev Get user's verification details
     */
    function getUserVerification(address _userAddress) external view returns (UserVerification memory) {
        return userVerifications[_userAddress];
    }
}
