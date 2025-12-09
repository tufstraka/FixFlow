// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BountyEscrow
 * @dev Manages bounty states for GitHub issues with time-based escalation
 * @notice This contract tracks bounties while MNEE payments are handled off-chain via MNEE API
 */
contract BountyEscrow is Ownable, ReentrancyGuard, Pausable {
    struct Bounty {
        uint256 initialAmount;
        uint256 currentAmount;
        uint256 maxAmount;
        uint256 createdAt;
        uint256 lastEscalation;
        address repository;
        uint256 issueId;
        string solver;  // Changed to string to store MNEE address
        bool claimed;
        string issueUrl;
        string paymentTxId; // MNEE transaction ID
    }

    struct EscalationConfig {
        uint256[] thresholdHours;   // Hours after creation for each escalation
        uint256[] increasePercents; // Percentage increase for each threshold
        uint256 maxMultiplier;      // Maximum multiplier cap (e.g., 300 = 3x)
    }

    uint256 public nextBountyId;
    uint256 public totalActiveBounties;
    uint256 public totalClaimedBounties;
    
    mapping(uint256 => Bounty) public bounties;
    mapping(address => bool) public authorizedBots;
    mapping(address => EscalationConfig) public repoEscalationConfigs;
    
    // Default escalation config
    EscalationConfig public defaultEscalationConfig;
    
    // Events
    event BountyCreated(uint256 indexed bountyId, address indexed repository, uint256 issueId, uint256 amount, string issueUrl);
    event BountyEscalated(uint256 indexed bountyId, uint256 oldAmount, uint256 newAmount);
    event BountyClaimed(uint256 indexed bountyId, string solver, uint256 amount, string paymentTxId);
    event BountyCanceled(uint256 indexed bountyId);
    event BotAuthorized(address indexed bot);
    event BotDeauthorized(address indexed bot);
    event EscalationConfigUpdated(address indexed repository);

    modifier onlyAuthorizedBot() {
        require(authorizedBots[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor() Ownable(msg.sender) {
        // Set default escalation config
        defaultEscalationConfig.thresholdHours = [24, 72, 168]; // 1 day, 3 days, 1 week
        defaultEscalationConfig.increasePercents = [20, 50, 100]; // +20%, +50%, +100%
        defaultEscalationConfig.maxMultiplier = 300; // 3x max
    }

    /**
     * @dev Creates a new bounty for a GitHub issue
     * @param repository Repository address/identifier
     * @param issueId GitHub issue ID
     * @param amount Initial bounty amount
     * @param maxAmount Maximum amount after escalation
     * @param issueUrl URL of the GitHub issue
     */
    function createBounty(
        address repository,
        uint256 issueId,
        uint256 amount,
        uint256 maxAmount,
        string calldata issueUrl
    ) external onlyAuthorizedBot whenNotPaused returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(maxAmount >= amount, "Max amount must be >= initial amount");
        
        uint256 bountyId = nextBountyId++;
        
        bounties[bountyId] = Bounty({
            initialAmount: amount,
            currentAmount: amount,
            maxAmount: maxAmount,
            createdAt: block.timestamp,
            lastEscalation: block.timestamp,
            repository: repository,
            issueId: issueId,
            solver: "",
            claimed: false,
            issueUrl: issueUrl,
            paymentTxId: ""
        });
        
        totalActiveBounties++;
        
        emit BountyCreated(bountyId, repository, issueId, amount, issueUrl);
        
        return bountyId;
    }

    /**
     * @dev Escalates bounty amount based on time elapsed
     * @param bountyId ID of the bounty to escalate
     */
    function escalateBounty(uint256 bountyId) public whenNotPaused returns (bool, uint256) {
        Bounty storage bounty = bounties[bountyId];
        require(!bounty.claimed, "Bounty already claimed");
        require(bounty.createdAt > 0, "Bounty does not exist");
        
        EscalationConfig memory config = repoEscalationConfigs[bounty.repository].thresholdHours.length > 0 
            ? repoEscalationConfigs[bounty.repository] 
            : defaultEscalationConfig;
        
        uint256 hoursElapsed = (block.timestamp - bounty.createdAt) / 3600;
        uint256 oldAmount = bounty.currentAmount;
        uint256 newAmount = bounty.initialAmount;
        
        // Find the appropriate escalation level
        for (uint256 i = 0; i < config.thresholdHours.length; i++) {
            if (hoursElapsed >= config.thresholdHours[i]) {
                uint256 increase = (bounty.initialAmount * config.increasePercents[i]) / 100;
                newAmount = bounty.initialAmount + increase;
            }
        }
        
        // Apply max multiplier cap
        uint256 maxAllowed = (bounty.initialAmount * config.maxMultiplier) / 100;
        if (newAmount > maxAllowed) {
            newAmount = maxAllowed;
        }
        
        // Apply bounty-specific max amount cap
        if (newAmount > bounty.maxAmount) {
            newAmount = bounty.maxAmount;
        }
        
        // Only escalate if amount increases
        if (newAmount > oldAmount) {
            bounty.currentAmount = newAmount;
            bounty.lastEscalation = block.timestamp;
            
            emit BountyEscalated(bountyId, oldAmount, newAmount);
            return (true, newAmount);
        }
        
        return (false, oldAmount);
    }

    /**
     * @dev Marks a bounty as claimed after payment is confirmed
     * @param bountyId ID of the bounty to claim
     * @param solver MNEE address of the developer who solved the issue
     * @param paymentTxId MNEE transaction ID of the payment
     */
    function claimBounty(
        uint256 bountyId, 
        string calldata solver,
        string calldata paymentTxId
    ) external onlyAuthorizedBot nonReentrant whenNotPaused {
        Bounty storage bounty = bounties[bountyId];
        require(!bounty.claimed, "Bounty already claimed");
        require(bounty.createdAt > 0, "Bounty does not exist");
        require(bytes(solver).length > 0, "Invalid solver address");
        require(bytes(paymentTxId).length > 0, "Invalid payment transaction ID");
        
        uint256 finalAmount = bounty.currentAmount;
        bounty.claimed = true;
        bounty.solver = solver;
        bounty.paymentTxId = paymentTxId;
        
        totalActiveBounties--;
        totalClaimedBounties++;
        
        emit BountyClaimed(bountyId, solver, finalAmount, paymentTxId);
    }

    /**
     * @dev Cancels a bounty
     * @param bountyId ID of the bounty to cancel
     */
    function cancelBounty(uint256 bountyId) external onlyAuthorizedBot nonReentrant whenNotPaused {
        Bounty storage bounty = bounties[bountyId];
        require(!bounty.claimed, "Bounty already claimed");
        require(bounty.createdAt > 0, "Bounty does not exist");
        
        bounty.claimed = true;
        totalActiveBounties--;
        
        emit BountyCanceled(bountyId);
    }

    /**
     * @dev Sets escalation configuration for a specific repository
     * @param repository Repository address
     * @param thresholdHours Array of hour thresholds
     * @param increasePercents Array of percentage increases
     * @param maxMultiplier Maximum multiplier (e.g., 300 = 3x)
     */
    function setRepoEscalationConfig(
        address repository,
        uint256[] calldata thresholdHours,
        uint256[] calldata increasePercents,
        uint256 maxMultiplier
    ) external onlyOwner {
        require(thresholdHours.length == increasePercents.length, "Arrays length mismatch");
        require(maxMultiplier >= 100, "Max multiplier must be >= 100");
        
        repoEscalationConfigs[repository] = EscalationConfig({
            thresholdHours: thresholdHours,
            increasePercents: increasePercents,
            maxMultiplier: maxMultiplier
        });
        
        emit EscalationConfigUpdated(repository);
    }

    /**
     * @dev Authorizes a bot to interact with the contract
     * @param bot Bot address to authorize
     */
    function authorizeBot(address bot) external onlyOwner {
        require(bot != address(0), "Invalid bot address");
        authorizedBots[bot] = true;
        emit BotAuthorized(bot);
    }

    /**
     * @dev Deauthorizes a bot
     * @param bot Bot address to deauthorize
     */
    function deauthorizeBot(address bot) external onlyOwner {
        authorizedBots[bot] = false;
        emit BotDeauthorized(bot);
    }

    /**
     * @dev Pauses the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Gets bounty details
     * @param bountyId ID of the bounty
     */
    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        return bounties[bountyId];
    }

    /**
     * @dev Gets all active bounty IDs for a repository
     * @param repository Repository address
     * @param offset Starting index
     * @param limit Maximum number of results
     */
    function getActiveBountiesForRepo(address repository, uint256 offset, uint256 limit) 
        external view returns (uint256[] memory bountyIds, uint256 total) {
        
        uint256 count = 0;
        
        // First, count total active bounties for this repo
        for (uint256 i = 0; i < nextBountyId; i++) {
            if (bounties[i].repository == repository && !bounties[i].claimed && bounties[i].createdAt > 0) {
                count++;
            }
        }
        
        total = count;
        
        // Determine actual limit
        uint256 actualLimit = limit;
        if (offset + limit > count) {
            actualLimit = count > offset ? count - offset : 0;
        }
        
        bountyIds = new uint256[](actualLimit);
        uint256 index = 0;
        uint256 skipped = 0;
        
        // Collect bounty IDs
        for (uint256 i = 0; i < nextBountyId && index < actualLimit; i++) {
            if (bounties[i].repository == repository && !bounties[i].claimed && bounties[i].createdAt > 0) {
                if (skipped >= offset) {
                    bountyIds[index++] = i;
                } else {
                    skipped++;
                }
            }
        }
        
        return (bountyIds, total);
    }

    /**
     * @dev Get contract statistics
     */
    function getStats() external view returns (
        uint256 totalBounties,
        uint256 activeBounties,
        uint256 claimedBounties
    ) {
        return (nextBountyId, totalActiveBounties, totalClaimedBounties);
    }
}