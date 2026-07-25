// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CookedRegistry — verifiable verdicts for AM I COOKED?
/// @notice The sealed judge (0G Compute TEE) scores a wallet; the app anchors the
///         score hash + TEE attestation hash here. Every share card links to a
///         verification page reading this registry → no photoshopped flexes.
///         The scoring rubric's hash is committed at deployment, before launch.
contract CookedRegistry {
    event Attested(bytes32 indexed scoreHash, bytes32 attestationHash, address indexed submitter, uint64 timestamp);

    /// @notice keccak256 of the sealed judge's rubric, fixed forever at deploy time.
    bytes32 public immutable rubricHash;

    struct Record { bytes32 attestationHash; uint64 timestamp; }
    mapping(bytes32 => Record) public records;
    uint256 public totalAttestations;

    constructor(bytes32 _rubricHash) {
        rubricHash = _rubricHash;
    }

    /// @notice Anchor a sealed verdict. Idempotent per scoreHash (first write wins —
    ///         a verdict cannot be quietly replaced).
    function attest(bytes32 scoreHash, bytes32 attestationHash) external {
        require(scoreHash != bytes32(0) && attestationHash != bytes32(0), "empty");
        require(records[scoreHash].timestamp == 0, "already attested");
        records[scoreHash] = Record(attestationHash, uint64(block.timestamp));
        totalAttestations++;
        emit Attested(scoreHash, attestationHash, msg.sender, uint64(block.timestamp));
    }

    /// @notice Verification page entry point: does this verdict exist, and when?
    function check(bytes32 scoreHash) external view returns (bool exists, bytes32 attestationHash, uint64 timestamp) {
        Record memory r = records[scoreHash];
        return (r.timestamp != 0, r.attestationHash, r.timestamp);
    }
}
