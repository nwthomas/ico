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

  event NewInvestment(address indexed purchaser, uint256 etherAmount);
  event NewPhase(Phases indexed phase);
  event Refund(address indexed refundAddress, uint256 etherAmount);
  event TokensClaimed(address indexed claimingAddress, uint256 tokenAmount);

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
      require(
        approvedSeedInvestors[msg.sender],
        "ICO: address is not approved"
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

  /**
   * @notice Allows users to buy tokens in the ICO
   * @dev Addresses can participate under the following conditions:
   *    - For seed phase, they must be approved and under 1,500 ether limit
   *    - For general phase, they must be under the 1,000 limit (inclusive of seed)
   * In addition, the private method _getExcessEtherToReturn checks if the address should have
   * ether returned to it with the following constraints:
   *    - If msg.value puts address partly over max individual contribution limit for phase,
   *      the excess is returned
   *    - If the msg.value puts the address partly over the max contribution limit for the phase,
   *      the excess is returned
   * If there is excess ether to return, that call is made immediately
   */
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
      emit Refund(msg.sender, amountToReturn);
    }

    emit NewInvestment(msg.sender, validContributionAmount);
  }

  /**
   * @notice Allows addresses that participated in the ICO to claim tokens in open phase
   */
  function claimTokens() external hasBeenInitialized isOpenPhase {
    require(
      addressToContributions[msg.sender] > 0,
      "ICO: address has no contributions"
    );

    uint256 amountToTransfer = addressToContributions[msg.sender] * 5;
    bool success = IERC20(tokenAddress).transfer(msg.sender, amountToTransfer);
    require(success, "ICO: tokens could not be claimed");
    emit TokensClaimed(msg.sender, amountToTransfer);
  }

  /**
    emit TokensClaimed(msg.sender, amountToTransfer);
   * @notice Allows the owner to initialized (e.g. start) the ICO contract
   * @param _tokenAddress The deployed token address to be used in the ICO
   */
  function initialize(address _tokenAddress) external onlyOwner {
    require(_tokenAddress != address(0), "ICO: address must be valid");
    tokenAddress = _tokenAddress;
    isInitialized = true;
  }

  /**
   * @notice Allows the owner to progress the phases of the ICO if contract has been initialized
   * @dev The phases cannot be progressed past open phase, nor can they be reversed once moved
   * forward
   */
  function progressPhases() external onlyOwner hasBeenInitialized {
    require(currentPhase != Phases.OPEN, "ICO: phases complete");

    currentPhase = Phases(uint256(currentPhase) + 1);
    emit NewPhase(currentPhase);
  }

  /**
   * @notice Allows the owner to pause/unpause the ICO
   */
  function toggleIsPaused() external onlyOwner {
    isPaused = !isPaused;
  }

  /**
   * @notice Allows the owner to toggle on/off if another address is a seed investor
   * @param _seedInvestor The address to toggle on/off
   */
  function toggleSeedInvestor(address _seedInvestor) external onlyOwner {
    approvedSeedInvestors[_seedInvestor] = !approvedSeedInvestors[
      _seedInvestor
    ];
  }

  /**
   * @notice Returns the excess amount of ether to return to a given address
   * @param _messageValue The msg.value that the address sent
   */
  function _getExcessEtherToReturn(uint256 _messageValue)
    private
    view
    hasBeenInitialized
    canContributeForCurrentPhase
    returns (uint256)
  {
    uint256 addressContributions = addressToContributions[msg.sender];
    uint256 newAddressContributions = addressContributions + _messageValue;
    uint256 newTotalContributions = totalContributions + _messageValue;

    if (
      currentPhase == Phases.SEED &&
      newAddressContributions > SEED_CONTRIBUTIONS_PER_ADDRESS
    ) {
      return newAddressContributions - SEED_CONTRIBUTIONS_PER_ADDRESS;
    } else if (
      currentPhase == Phases.SEED &&
      newTotalContributions > SEED_CONTRIBUTIONS_CAP
    ) {
      return newTotalContributions - SEED_CONTRIBUTIONS_CAP;
    } else if (
      currentPhase == Phases.GENERAL &&
      newAddressContributions > GENERAL_CONTRIBUTIONS_PER_ADDRESS
    ) {
      return newAddressContributions - GENERAL_CONTRIBUTIONS_PER_ADDRESS;
    } else if (
      currentPhase == Phases.GENERAL &&
      newTotalContributions > GENERAL_CONTRIBUTIONS_CAP
    ) {
      return newTotalContributions - GENERAL_CONTRIBUTIONS_CAP;
    }

    return 0;
  }

  /**
   * @dev This method has been specifically disallowed in favor of the buyTokens function
   */
  receive() external payable {
    revert("ICO: use buyTokens function");
  }
}
