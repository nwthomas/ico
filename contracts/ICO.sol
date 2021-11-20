// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./SpaceCoin.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title A contract for rolling out an ICO of SpaceCoin
 * @author Nathan Thomas
 * @notice This contract is not audited - Use at your own risk!
 */
contract ICO is Ownable {
  // ICO is for 150,000 tokens at 5/1 tokens/ether
  uint256 private constant TOKEN_MULTIPLIER = 5;

  // Seed phase is 75,000 tokens with an individual cap
  uint256 private constant SEED_CONTRIBUTIONS_PER_ADDRESS = 1_500 ether;
  uint256 private constant SEED_CONTRIBUTIONS_CAP = 15_000 ether;

  // General phase is 75,000 tokens with an individual cap
  uint256 private constant GENERAL_CONTRIBUTIONS_PER_ADDRESS = 1_000 ether;
  uint256 private constant GENERAL_CONTRIBUTIONS_CAP = 30_000 ether;

  enum Phases {
    SEED,
    GENERAL,
    OPEN
  }

  Phases public currentPhase = Phases.SEED;
  bool private initialized = false;
  bool public isPaused = false;
  uint256 private raisedAmount = 0;
  address public tokenAddress;

  mapping(address => uint256) public addressToContributions;
  mapping(address => bool) public approvedSeedInvestors;

  event NewPhase(Phases indexed phase);

  modifier hasContributions() {
    require(
      addressToContributions[msg.sender] > 0,
      "ICO: address has no contributions"
    );
    _;
  }

  modifier isNotPaused() {
    require(!isPaused, "ICO: the ICO is paused");
    _;
  }

  modifier isOpenPhase() {
    require(currentPhase == Phases.OPEN, "ICO: not open phase");
    _;
  }

  modifier isInitialized() {
    require(initialized, "ICO: not initialized");
    _;
  }

  modifier canContributeForCurrentPhase() {
    if (currentPhase == Phases.SEED) {
      require(
        raisedAmount < SEED_CONTRIBUTIONS_CAP,
        "ICO: phase contributions reached"
      );
      require(
        addressToContributions[msg.sender] < SEED_CONTRIBUTIONS_PER_ADDRESS,
        "ICO: contribution maximum reached"
      );
    } else if (currentPhase == Phases.GENERAL) {
      require(
        raisedAmount < GENERAL_CONTRIBUTIONS_CAP,
        "ICO: phase contributions reached"
      );
      require(
        addressToContributions[msg.sender] < GENERAL_CONTRIBUTIONS_PER_ADDRESS,
        "ICO: contribution maximum reached"
      );
    }
    _;
  }

  constructor(address _tokenAddress) {
    require(_tokenAddress != address(0), "ICO: address must be valid");
    tokenAddress = _tokenAddress;
  }

  function buyTokens()
    external
    payable
    isInitialized
    isNotPaused
    canContributeForCurrentPhase
  {
    uint256 amountToReturn = _getExcessEtherToReturn(msg.value);
    uint256 validContributionAmount = msg.value - amountToReturn;
    addressToContributions[msg.sender] += validContributionAmount;
    raisedAmount += validContributionAmount;

    if (amountToReturn > 0) {
      (bool success, ) = msg.sender.call{ value: amountToReturn }("");
      require(success, "ICO: excess funds transfer failed");
    }
  }

  function claimTokens() external isInitialized isOpenPhase hasContributions {
    uint256 amountToTransfer = addressToContributions[msg.sender] * 5 * 10**18;
    IERC20(tokenAddress).transfer(msg.sender, amountToTransfer);
  }

  /**
   * @notice Initializes the contract whenever owner address wants ICO to start
   */
  function initialize() external onlyOwner {
    initialized = true;
  }

  /**
   * @notice Allows the owner to progress the ICO through its phases
   * @dev The contract cannot move back in phases, only forward
   */
  function progressPhases() external onlyOwner isInitialized {
    require(currentPhase != Phases.OPEN, "ICO: phases complete");

    currentPhase = Phases(uint256(currentPhase) + 1);
    emit NewPhase(currentPhase);
  }

  /**
   * @notice Toggles pausing the ICO contract
   */
  function toggleIsPaused() external onlyOwner isInitialized {
    isPaused = !isPaused;
  }

  /**
   * @notice Toggles whether or not a given address is eligible for seed phase investment
   */
  function toggleSeedInvestor(address seedInvestor) external onlyOwner {
    approvedSeedInvestors[seedInvestor] = !approvedSeedInvestors[seedInvestor];
  }

  /**
   * @notice Private method to calculate the exact amount of ether to return (if any)
   * @param _messageValue The ether derived from msg.value
   */
  function _getExcessEtherToReturn(uint256 _messageValue)
    private
    view
    isInitialized
    isNotPaused
    canContributeForCurrentPhase
    returns (uint256)
  {
    uint256 addressContributions = addressToContributions[msg.sender];
    uint256 newContributionsTotal = addressContributions + _messageValue;

    if (currentPhase == Phases.SEED) {
      return
        newContributionsTotal > SEED_CONTRIBUTIONS_PER_ADDRESS
          ? newContributionsTotal - SEED_CONTRIBUTIONS_PER_ADDRESS
          : 0;
    } else if (currentPhase == Phases.GENERAL) {
      return
        newContributionsTotal > GENERAL_CONTRIBUTIONS_PER_ADDRESS
          ? newContributionsTotal - GENERAL_CONTRIBUTIONS_PER_ADDRESS
          : 0;
    }

    // Covers general phase when the total ICO cap is all that matters
    uint256 newRaisedAmount = addressContributions + raisedAmount;
    return
      newRaisedAmount > GENERAL_CONTRIBUTIONS_CAP
        ? newRaisedAmount - GENERAL_CONTRIBUTIONS_CAP
        : 0;
  }

  receive() external payable {
    revert("ICO: use buyTokens function");
  }
}
