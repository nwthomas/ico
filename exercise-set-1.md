# Solidity Exercises

The following is a list of questions and exercises to help you gain a deeper understanding of Solidity.

> Note: The provided reference material does not cover all questions. You will still need to google.

## Types

1. The type uint is equivalent with the type **\_**.

   - `uint256`

2. The type string is equivalent with the type **\_**.

   - `bytes`

3. Internally, enum is represented as **\_**.

   - A `uint` (size depending on size of enum)

4. What is the max value of a uint256 in decimal? In hex?

   - Decimal: `2**256 – 1`
   - Hex: `0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`

5. How do you compare strings? How do you concat them?

   - If you want to compare strings, you should use `keccak256(abi.encodePacked(<string one>)) == keccak256(abi.encodePacked(<string two>))`
   - If you want to concat strings, you should use `string(abi.encodePacked(<string one>, <string two>))`

6. What is the difference between type address and type address payable?

   - The type `address` and type `address payable` only have differences prior to compile time. After compilation, they are the same. They are merely a designation to track which addresses should be allowed to manage ether (receive, etc.).

7. What is the purpose of the private keyword in Solidity?

   - The `private` keyword in Solidity means that only code inside the contract can access the code. However, this does not mean that the code is shielded on the blockchain as anyone can still read the data if they want to .

Reference material

- https://medium.com/coinmonks/ethereum-solidity-memory-vs-storage-which-to-use-in-local-functions-72b593c3703a
- https://medium.com/mycrypto/why-do-we-need-transaction-data-39c922930e92

## Transactions

1. What are all the fields of an Ethereum transaction?

   - **nonce** (number of txns sent by sender)
   - **gas price**
   - **gas limit**
   - **to** (address)
   - **value**
   - **data** (calldata)
   - **v**
   - **r**
   - **s**

2. What is msg in Solidity? What non-deprecated fields do you have access to via msg?

   - The `msg` global variable in Solidity has a variety of useful fields in it (like `value` or `sender`).
   - The non-deprecated fields include `data`, `sender`, `sig`, and `value`.

3. What is tx in Solidity? What fields do you have access to via tx?

   - The `tx` global variable gives data about the original caller of the external account that started the transaction.
   - The fields available on it include `origin` and `gasprice`.

4. What is block in Solidity? What non-deprecated fields do you have access to via block?

   - The `block` global variable includes information about the current block in the EVM.
   - Fields available on the `block` include `basefee`, `chainid`, `coinbase`, `difficulty`, `gaslimit`, `number`, and `timestamp`.

5. What persists after a transaction gets reverted?

   - Any gas used up to that point persists and is not given back to the `msg.sender`.

6. When you deploy a contract, what are you sending in the data field of that transaction?

   - You are sending bytecode that will be stored and executed on the EVM.

Reference material

- https://medium.com/@eiki1212/ethereum-transaction-structure-explained-aa5a94182ad6
- https://medium.com/mycrypto/why-do-we-need-transaction-data-39c922930e92

## Gas Costs

In this context, "gas cost" means amount of gas, not wei per gas.

1. What is the standard gas cost of a transaction?

   - As of the London upgrade, the current standard gas cost of a transactions is: `Gas units (limit) * (Base fee + Tip)`.
   - For an Eth transfer, the standard cost is "21,000 units of gas."

2. What is the gas cost of deploying a contract?

   - The cost is based on:
     - 32k gas base price
     - Amount of bytecode in deployed contract
     - Code run in constructors of contracts
     - Current gas prices
     - The gas limit (effective estimated cost of deployment)

3. How did the recent (Aug 9th) London upgrade affect gas costs?
4. What version of Solidity introduced automatic "safe math" operations?

   - `0.8.0` 🎉

5. What is the tradeoff of having all math operations safe?

   - You don't have overflow/underflow error messages from the SafeMath library

6. What is the syntax for performing an unchecked math operation?

   - The `unchecked { ... }` syntax can be used.

7. What causes the difference in gas cost between Foo memory x = ... and Foo storage x = ...?

   - The `storage` keyword designates that data is being stored on the EVM, thus requiring a massive amount of gas to save. In contrast, the `memory` keyword designates that data should be stored in temporary memory and costs very little. It's also removed at the end of the function call/code block logic.

Reference material

- https://ethereum.org/en/developers/docs/gas/
- https://ethereum.stackexchange.com/questions/35539/what-is-the-real-price-of-deploying-a-contract-on-the-mainnet/37898
- https://medium.com/coinmonks/8-ways-of-reducing-the-gas-consumption-of-your-smart-contracts-9a506b339c0a

## EVM

1. What are the three different areas EVM programs can store data?

   - `memory`
   - `storage`
   - `stack`

2. What is the difference between assert(), revert(), and require()? What EVM opcodes do they use?

   - `assert` compiles to an invalid opcode, aborts the execution, and uses all remaining gas while reverting all changes
   - `require` compiles to a `REVERT` opcode and refunds any remaining gas
   - `revert` is like `require` but allows more complex logic (`if`/`else` statements)

3. What is the difference between CALL, CALLCODE, and DELEGATECALL? Which one is deprecated?

   - `CALL` processes a function in the context of the call destination contract
   - `DELETECALL` processes a function in the context of the calling contract
   - `CALLCODE` callcode has been deprecated in favor of `DELEGATECALL` (`CALLCODE` had a bug where `msg.sender` and `msg.value` were not preserved)

4. What is the syntax for writing inline assembly in Solidity? Where are the docs for this?

   - You can write inline assembly code with the `assembly { ... }` syntax
   - The docs for it are here: https://docs.soliditylang.org/en/v0.8.9/assembly.html

Reference Material

- https://medium.com/coinmonks/ethereum-solidity-memory-vs-storage-which-to-use-in-local-functions-72b593c3703a
- https://eips.ethereum.org/EIPS/eip-214
- https://ethereum.github.io/yellowpaper/paper.pdf
- https://gist.github.com/sogoiii/f0ced0a4e569b5f38d302e7072d78b43

## Legacy Solidity

You will see plenty of old solidity contracts in the wild.

1. What was the original purpose of Solidity's .send() and .transfer() functions? How did it fail?

   - They were intended to guard against reentrancy attacks since they have a gas limit of 2300. However, they are obselete as `fallback` functions now use _more_ than 2300 gas.

2. The type var is equivalent with the type **\_**.

   - It was equivalent to the first type of value assigned to the variable.

3. What version of Solidity introduced the receive() function definition? What was the equivalent before it?

   - Solidity `0.6.0` introduced the `receive` function
   - > Before, the equivalent was

4. What version of Solidity introduced length checking for msg.data? What manual check does this cover?

   - `0.5.0`

5. What version of Solidity make checking for accidental zero addresses obsolete?

   - `0.5.0`
