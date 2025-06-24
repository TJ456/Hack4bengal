// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./CivicVerifier.sol";

/**
 * @title CivicSBT
 * @dev Implementation of a Soulbound Token (SBT) for Civic verification status.
 * Tokens can be minted but not transferred, following SBT principles.
 */
contract CivicSBT is ERC721URIStorage {
    using Counters for Counters.Counter;
    using Strings for uint256;

    struct TokenMetadata {
        uint256 issuedAt;
        uint256 verificationLevel; // 1 = low, 2 = medium, 3 = high
        uint256 trustScore;
        uint256 votingAccuracy;
        uint256 doiParticipation;
    }

    Counters.Counter private _tokenIds;
    CivicVerifier public civicVerifier;
    mapping(address => uint256) private _addressToTokenId;
    mapping(uint256 => TokenMetadata) private _tokenMetadata;

    event SBTMinted(address indexed to, uint256 indexed tokenId);
    event MetadataUpdated(uint256 indexed tokenId, string newUri);

    constructor(address _civicVerifier) ERC721("CivicSBT", "CSBT") {
        civicVerifier = CivicVerifier(_civicVerifier);
    }

    /**
     * @dev Mint a new SBT for a verified Civic user.
     * Can only be minted if the address is verified by Civic.
     */
    function mint(
        uint256 verificationLevel,
        uint256 trustScore,
        uint256 votingAccuracy,
        uint256 doiParticipation
    ) public returns (uint256) {
        require(!hasSBT(msg.sender), "Address already has an SBT");
        require(civicVerifier.isVerified(msg.sender), "Address not Civic verified");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        TokenMetadata memory metadata = TokenMetadata({
            issuedAt: block.timestamp,
            verificationLevel: verificationLevel,
            trustScore: trustScore,
            votingAccuracy: votingAccuracy,
            doiParticipation: doiParticipation
        });

        _tokenMetadata[newTokenId] = metadata;
        _addressToTokenId[msg.sender] = newTokenId;
        _safeMint(msg.sender, newTokenId);

        string memory tokenURI = generateTokenURI(newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        emit SBTMinted(msg.sender, newTokenId);
        return newTokenId;
    }

    /**
     * @dev Update an existing token's metadata.
     * Can only be updated by the Civic verifier contract.
     */
    function updateMetadata(
        address holder,
        uint256 verificationLevel,
        uint256 trustScore,
        uint256 votingAccuracy,
        uint256 doiParticipation
    ) public {
        require(msg.sender == address(civicVerifier), "Only Civic verifier can update metadata");
        require(hasSBT(holder), "Address has no SBT");

        uint256 tokenId = _addressToTokenId[holder];
        TokenMetadata storage metadata = _tokenMetadata[tokenId];
        
        metadata.verificationLevel = verificationLevel;
        metadata.trustScore = trustScore;
        metadata.votingAccuracy = votingAccuracy;
        metadata.doiParticipation = doiParticipation;

        string memory newUri = generateTokenURI(tokenId);
        _setTokenURI(tokenId, newUri);

        emit MetadataUpdated(tokenId, newUri);
    }

    /**
     * @dev Check if an address has an SBT.
     */
    function hasSBT(address owner) public view returns (bool) {
        return _addressToTokenId[owner] > 0;
    }

    /**
     * @dev Get token metadata for an address.
     */
    function getTokenMetadata(address owner) public view returns (TokenMetadata memory) {
        require(hasSBT(owner), "Address has no SBT");
        return _tokenMetadata[_addressToTokenId[owner]];
    }

    /**
     * @dev Generate token URI containing metadata.
     */
    function generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        TokenMetadata memory metadata = _tokenMetadata[tokenId];
        
        bytes memory dataURI = abi.encodePacked(
            '{',
            '"name": "Civic Soulbound Token #', tokenId.toString(), '",',
            '"description": "Non-transferable token representing Civic identity verification and reputation",',
            '"image": "https://civic.me/api/sbt-image/', tokenId.toString(), '",',
            '"attributes": [',
            '{"trait_type": "Issued At", "value": "', metadata.issuedAt.toString(), '"},',
            '{"trait_type": "Verification Level", "value": "', metadata.verificationLevel.toString(), '"},',
            '{"trait_type": "Trust Score", "value": "', metadata.trustScore.toString(), '"},',
            '{"trait_type": "Voting Accuracy", "value": "', metadata.votingAccuracy.toString(), '"},',
            '{"trait_type": "DOI Participation", "value": "', metadata.doiParticipation.toString(), '"}',
            ']}'
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(dataURI)
            )
        );
    }

    /**
     * @dev Override transfer functions to prevent transfers (SBT).
     */
    function _transfer(address from, address to, uint256 tokenId) internal virtual override {
        revert("SBTs cannot be transferred");
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual override {
        revert("SBTs cannot be transferred");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {
        revert("SBTs cannot be transferred");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public virtual override {
        revert("SBTs cannot be transferred");
    }
}
