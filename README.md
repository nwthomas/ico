# SPACE COIN ICO

This directory houses the contracts for an ICO for Space Coin.

## TABLE OF CONTENTS

- [Specification](#specification)
- [Additional Information](#additional-information)
- [Design Exercise](#design-exercise)

## SPECIFICATION

The initial description is as follows:

```
The smart contract aims to raise 30,000 Ether by performing an ICO. The ICO should only be available to whitelisted private investors starting in Phase Seed with a maximum total private contribution limit of 15,000 Ether and an individual contribution limit of 1,500 Ether. The ICO should become available to the general public during Phase General, with a total contribution limit equal to 30,000 Ether, inclusive of funds raised from the private phase. During this phase, the individual contribution limit should be 1,000 Ether, until Phase Open, at which point the individual contribution limit should be removed. At that point, the ICO contract should immediately release ERC20-compatible tokens for all contributors at an exchange rate of 5 tokens to 1 Ether. The owner of the contract should have the ability to pause and resume fundraising at any time, as well as move a phase forwards (but not backwards) at will.
```

There are additional parameters:

```
This token should have:

- 500,000 max total supply
- A 2% tax on every transfer that gets put into a treasury account
- A flag that toggles this tax on/off, controllable by owner, initialized to false
```

## ADDITIONAL INFORMATION

These final parameters were discovered upon discussion and examination:

```
- If the contribution is over the total limit for a phase, it can either fail or send the excess back
- Once an individual limit is met, that's it for all phases for that address
- When a transfer happens, the address receiving tokens will get n - 2% from the tax if it's turned on
- Tokens can be available either on phase change or once the OPEN phase hits
- All contributions once OPEN stage starts are available immediately
- Token symbol should be "SPC"
- Taxed 2% treasury tokens from transactions should be sent to treasury address
- Initial assignment of tokens to addresses should be taxed
- Transitions between phases should be controlled by the owner
- Only use the base ERC20 Open Zeppelin contract
- The maximum ether raised is 30k which means the total tokens distributed will be 150k. The extra will be used in a future project.
```

## DESIGN EXERCISE

The base requirements give contributors their SPC tokens immediately. How would you design your contract to vest the awarded tokens instead, i.e. award tokens to users over time?

```
If we were to award tokens over time, we could simply track both the amount contributed as well as when they contributed the ether (such as in a struct). Then we could have a getter function that would return a boolean on if the user had tokens to claim (and would perhaps call a private function or use a modifier to check if this was the case).

The user could then call a public function to claim their tokens once they have vested.
```
