// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract SpaceCoin {
  bool public isTaxingTokens = true;

  constructor(address[] memory _seedInvestors) {
    // finish
  }

  /// @notice Toggles the state varaibles that controls token tax on transactions
  function toggleIsTaxingTokens() external {
    isTaxingTokens = isTaxingTokens ? false : true;
  }
}
