// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Agentic ID for the Surgeon agent — the ERC-7857 (draft) surface SEAL uses:
/// metadata lives encrypted on 0G Storage, the chain holds only its URI + hash,
/// and transfers re-encrypt for the new owner behind an oracle proof (TEE/ZKP;
/// MockOracle stands in on testnet). Not a full ERC-721 — the agent identity is
/// non-fungible but app-bound, so only the surface the app reads is exposed.
interface IReencryptionOracle {
    function verifyProof(bytes calldata proof, bytes32 oldHash, bytes32 newHash) external view returns (bool);
}

contract AgenticID {
    string public constant name = "Am I Cooked - Agentic ID";
    string public constant symbol = "COOKID";
    address public immutable oracle;
    uint256 public nextId = 1;

    mapping(uint256 => address) public ownerOf;
    mapping(uint256 => string) public encryptedURI;
    mapping(uint256 => bytes32) public metadataHash;

    event AgentMinted(uint256 indexed tokenId, address indexed to, string encryptedURI, bytes32 metadataHash);
    event AgentTransferred(uint256 indexed tokenId, address indexed from, address indexed to, bytes32 newMetadataHash);

    constructor(address _oracle) { oracle = _oracle; }

    function mint(address to, string calldata uri, bytes32 hash) external returns (uint256 tokenId) {
        tokenId = nextId++;
        ownerOf[tokenId] = to;
        encryptedURI[tokenId] = uri;
        metadataHash[tokenId] = hash;
        emit AgentMinted(tokenId, to, uri, hash);
    }

    /// ERC-7857 transfer: the metadata is re-encrypted for the recipient off-chain;
    /// the oracle proof binds old hash to new hash, sealedKey rides in calldata so
    /// the delivery is auditable on-chain without revealing the key material's use.
    function transfer(
        address to,
        uint256 tokenId,
        string calldata newURI,
        bytes32 newHash,
        bytes calldata /* sealedKey */,
        bytes calldata proof
    ) external {
        require(msg.sender == ownerOf[tokenId], "not owner");
        require(IReencryptionOracle(oracle).verifyProof(proof, metadataHash[tokenId], newHash), "oracle rejected proof");
        ownerOf[tokenId] = to;
        encryptedURI[tokenId] = newURI;
        metadataHash[tokenId] = newHash;
        emit AgentTransferred(tokenId, msg.sender, to, newHash);
    }
}

contract MockOracle is IReencryptionOracle {
    function verifyProof(bytes calldata, bytes32, bytes32) external pure returns (bool) { return true; }
}
