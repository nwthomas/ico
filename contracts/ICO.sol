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
  bool public isInitialized = false;
  bool public isPaused = false;
  address public tokenAddress;
  uint256 public totalContributions = 0;

  mapping(address => uint256) public addressToContributions;
  mapping(address => bool) public approvedSeedInvestors;

  event ClaimedTokens(address indexed claimingAddress, uint256 tokenAmount);
  event NewInvestment(address indexed purchaser, uint256 etherAmount);
  event NewPhase(Phases indexed phase);

  modifier hasBeenInitialized() {
    require(isInitialized, "ICO: not initialized");
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

  modifier canContributeForCurrentPhase() {
    if (currentPhase == Phases.SEED) {
      require(
        totalContributions < SEED_CONTRIBUTIONS_CAP,
        "ICO: phase contributions reached"
      );
      require(
        addressToContributions[msg.sender] < SEED_CONTRIBUTIONS_PER_ADDRESS,
        "ICO: contribution maximum reached"
      );
    } else if (currentPhase == Phases.GENERAL) {
      require(
        totalContributions < GENERAL_CONTRIBUTIONS_CAP,
        "ICO: phase contributions reached"
      );
      require(
        addressToContributions[msg.sender] < GENERAL_CONTRIBUTIONS_PER_ADDRESS,
        "ICO: contribution maximum reached"
      );
    }

    _;
  }

  function buyTokens()
    external
    payable
    hasBeenInitialized
    isNotPaused
    canContributeForCurrentPhase
  {
    uint256 amountToReturn = _getExcessEtherToReturn(msg.value);
    uint256 validContributionAmount = msg.value - amountToReturn;
    addressToContributions[msg.sender] += validContributionAmount;
    totalContributions += validContributionAmount;

    if (amountToReturn > 0) {
      (bool success, ) = msg.sender.call{ value: amountToReturn }("");
      require(success, "ICO: excess funds transfer failed");
    }

    emit NewInvestment(msg.sender, validContributionAmount);
  }

  function claimTokens() external hasBeenInitialized isOpenPhase {
    require(
      addressToContributions[msg.sender] > 0,
      "ICO: address has no contributions"
    );

    uint256 amountToTransfer = addressToContributions[msg.sender] * 5 * 10**18;
    IERC20(tokenAddress).transfer(msg.sender, amountToTransfer);
    emit ClaimedTokens(msg.sender, amountToTransfer);
  }

  function initialize(address _tokenAddress) external onlyOwner {
    require(_tokenAddress != address(0), "ICO: address must be valid");
    tokenAddress = _tokenAddress;
    isInitialized = true;
  }

  function progressPhases() external onlyOwner hasBeenInitialized {
    require(currentPhase != Phases.OPEN, "ICO: phases complete");

    currentPhase = Phases(uint256(currentPhase) + 1);
    emit NewPhase(currentPhase);
  }

  function toggleIsPaused() external onlyOwner hasBeenInitialized {
    isPaused = !isPaused;
  }

  function toggleSeedInvestor(address seedInvestor) external onlyOwner {
    approvedSeedInvestors[seedInvestor] = !approvedSeedInvestors[seedInvestor];
  }

  function _getExcessEtherToReturn(uint256 _messageValue)
    private
    view
    hasBeenInitialized
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
    uint256 newTotalContributions = addressContributions + totalContributions;
    return
      newTotalContributions > GENERAL_CONTRIBUTIONS_CAP
        ? newTotalContributions - GENERAL_CONTRIBUTIONS_CAP
        : 0;
  }

  receive() external payable {
    revert("ICO: use buyTokens function");
  }
}
