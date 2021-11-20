// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/tokens/SafeERC20.sol";

/**
 * @title A contract for rolling out an ICO of SpaceCoin
 * @author Nathan Thomas
 * @notice This contract is not audited - Use at your own risk!
 */
contract ICO is Ownable {
  // Total supply is aiming for 150,000 tokens at 5/1 tokens/ether
  uint256 private constant CONTRIBUTION_CAP = 30_000 ether;
  uint256 private constant TOKEN_MULTIPLIER = 5;
  uint256 private constant MAX_CONTRIBUTION_PER_ADDRESS = 1_000 ether;

  bool private initialized = false;
  bool public isPaused = false;
  uint256 public raisedAmount = 0;
  address public tokenAddress;

  mapping(address => uint256) public addressToContributions;

  enum Phases {
    SEED,
    GENERAL,
    OPEN
  }
  string public currentPhase = Phases.SEED;

  event NewPhase(string indexed phase);

  modifier isNotPaused() {
    require(!isPaused, "ICO: the ICO is paused");
    _;
  }

  modifier isInitialized() {
    require(isInitialized, "ICO: not initialized");
    _;
  }

  modifier canContributeForCurrentPhase() {
    if (currentPhase == Phases.SEED) {
      require(raisedAmount < 15_000 ether, "ICO: phase contributions reached");
      require(
        addressToContributions[msg.sender] < 1_500 ether,
        "ICO: address phase contributions reached"
      );
    } else if (currentPhase == Phases.GENERAL) {
      require(raisedAmount < 30_000 ether, "ICO: phase contributions reached");
      require(
        addressToContributions[msg.sender] < 1_000 ether,
        "ICO: address phase contributions reached"
      );
    } else {
      require(
        raisedAmount < CONTRIBUTION_CAP,
        "ICO: phase contributions reached"
      );
    }
    _;
  }

  constructor(
    address memory _tokenAddress,
    address[] memory _approvedSeedInvestors
  ) {
    require(_tokenAddress != 0, "ICO: address must be valid");
    tokenAddress = _tokenAddress;
  }

  function buyTokens()
    external
    payable
    isInitialized
    isNotPaused
    canContributeForCurrentPhase
  {
    uint256 amountToReturn = _excessEtherToReturn(msg.value);
    uint256 validContributionAmount = msg.value - amountToReturn;
    addressToContributions[msg.sender] += msg.value;
    raisedAmount += validContributionAmount;

    uint256 tokensBought = validContributionAmount * TOKEN_MULTIPLIER;
    SafeERC20(tokenAddress).transfer(tokensBought);

    if (amountToReturn > 0) {
      (bool success, ) = msg.sender.call{ value: amountToReturn }("");
    }
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
    if (currentPhase == Phases.SEED) {
      currentPhase = Phases.GENERAL;
    } else {
      currentPhase = Phases.OPEN;
    }

    emit NewPhase(currentPhase);
  }

  /**
   * @notice Toggles pausing the ICO contract
   */
  function toggleIsPaused() external onlyOwner isInitialized {
    isPaused = !isPaused;
  }

  /**
   * @notice Private method to calculate the exact amount of ether to return (if any)
   * @param _messageValue The ether derived from msg.value
   */
  function _excessEtherToReturn(uint256 calldata _messageValue)
    private
    view
    isInitialized
    isNotPaused
    returns (uint256)
  {
    uint256 addressContributions = addressToContributions[msg.sender];
    uint256 newContributionsTotal = addressContributions + _messageValue;

    if (currentPhase == Phases.SEED) {
      return
        newContributionsTotal > 1_500 ether
          ? currentContributions - 1_500 ether
          : 0;
    } else if (currentPhase == Phases.GENERAL) {
      return
        newContributionsTotal > 1_000 ether
          ? currentContributions - 1_000 ether
          : 0;
    }

    // Covers general phase when the address caps no longer matter
    uint256 newRaisedAmount = addressContributions + raisedAmount;
    return newRaisedAmount > 30_000 ether ? newRaisedAmount - 30_000 : 0;
  }
}
