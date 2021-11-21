// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "hardhat/console.sol";

contract SpaceCoin is Ownable, ERC20 {
  // While this is a constant, it matches the outcome of the decimals() function in ERC20
  uint256 public constant MAX_SUPPLY = 500_000 * 10**18;
  uint256 public constant TAX_PERCENTAGE = 2;

  bool public isTaxingTokens = true;
  address public treasuryAddress;
  address public icoAddress;

  /**
   * @notice Creates a new SpaceCoin contract with ownership of msg.sender
   * @param _treasuryAddress The address tokens gained from taxation on transfer should be sent to
   * @param _icoAddress The address from the ICO contract
   * @dev The total token supply of 500,000 tokens (to 18 decimal places) will be minted
   * immediately on deploy
   */
  constructor(address _treasuryAddress, address _icoAddress)
    ERC20("Space Coin", "SPC")
  {
    require(
      _treasuryAddress != address(0) && _icoAddress != address(0),
      "SpaceCoin: address must not be 0"
    );

    icoAddress = _icoAddress;
    treasuryAddress = _treasuryAddress;
    _mint(_icoAddress, MAX_SUPPLY);
  }

  /**
   * @notice Toggles the state variables that controls token tax on transactions
   */
  function toggleIsTaxingTokens() external onlyOwner {
    isTaxingTokens = !isTaxingTokens;
  }

  /**
   * @notice Allows the owner to update the treasury address tokens from taxation are sent to
   * @param _newTreasuryAddress The address tokens from taxation should be sent to
   */
  function updateTreasuryAddress(address _newTreasuryAddress)
    external
    onlyOwner
  {
    require(
      _newTreasuryAddress != address(0),
      "SpaceCoin: address must not be 0"
    );

    treasuryAddress = _newTreasuryAddress;
  }

  /**
   * @notice This overrides the private method inside the ERC20 contract and lets this contract
   * loop in to tax tokens during the transfer process
   * @param _from The address tokens should be transferred from
   * @param _to The address tokens should be transferred to
   * @param _amount The amount of tokens that should be transferred (to 18 decimal places)
   */
  function _transfer(
    address _from,
    address _to,
    uint256 _amount
  ) internal virtual override {
    require(_amount > 0, "SpaceCoin: must be valid amount");

    if (isTaxingTokens) {
      uint256 taxAmount = (_amount * TAX_PERCENTAGE) / 100;
      _amount = _amount - taxAmount;
      super._transfer(_from, treasuryAddress, taxAmount);
    }

    super._transfer(_from, _to, _amount);
  }
}
