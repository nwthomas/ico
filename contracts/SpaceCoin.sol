// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SpaceCoin is Ownable, ERC20 {
  // While this is a constant, it matches the outcome of the decimals() function in ERC20
  uint256 private constant DECIMAL_POINTS = 10**18;
  uint256 public constant MAX_SUPPLY = 500_000 * DECIMAL_POINTS;
  uint256 public constant TAX_PERCENTAGE = 2;
  // ICO is aiming for 150,000 tokens at 5/1 tokens/ether
  uint256 private constant TOKEN_MULTIPLIER = 5;

  bool public isTaxingTokens = true;
  address private treasuryAddress;

  constructor(address _treasuryAddress, address _icoAddress)
    ERC20("Space Coin", "SPC")
  {
    treasuryAddress = _treasuryAddress;
    _mint(_icoAddress, MAX_SUPPLY);
  }

  /**
   * @notice Toggles the state variables that controls token tax on transactions
   */
  function toggleIsTaxingTokens() external onlyOwner {
    isTaxingTokens = !isTaxingTokens;
  }

  function _transfer(
    address _to,
    address _from,
    uint256 _amount
  ) internal virtual override {
    require(_amount > 0, "SpaceCoin: must be valid amount");

    if (isTaxingTokens) {
      uint256 taxAmount = (_amount / 100) * TAX_PERCENTAGE;
      _amount = _amount - taxAmount;
      super._transfer(treasuryAddress, _from, taxAmount);
    }

    super._transfer(_to, _from, _amount);
  }

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
}
