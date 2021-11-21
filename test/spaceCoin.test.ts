import chai from "chai";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { solidity } from "ethereum-waffle";
import { ethers } from "hardhat";
const { expect } = chai;

chai.use(solidity);

describe("SpaceCoin", () => {
  let account1: SignerWithAddress;
  let account2: SignerWithAddress;
  let account3: SignerWithAddress;
  let treasuryAccount: SignerWithAddress;
  let icoAccount: SignerWithAddress;

  const getDeployedSpaceCoinContract = async (args?: {
    treasuryAddress?: string;
    icoAddress?: string;
  }) => {
    const { treasuryAddress, icoAddress } = args || {};
    const contractFactory = await ethers.getContractFactory("SpaceCoin");
    const contract = await contractFactory.deploy(
      treasuryAddress || treasuryAccount.address,
      icoAddress || icoAccount.address
    );

    return contract;
  };

  beforeEach(async () => {
    const [owner, second, third, fourth, fifth] = await ethers.getSigners();

    account1 = owner;
    account2 = second;
    account3 = third;
    treasuryAccount = fourth;
    icoAccount = fifth;
  });

  describe("deploy", () => {
    it("assigns state variables for ERC20 project on deploy", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();

      const nameTxn = await spaceCoin.name();
      expect(nameTxn).to.equal("Space Coin");

      const symbolTxn = await spaceCoin.symbol();
      expect(symbolTxn).to.equal("SPC");
    });

    it("sets the treasury address on deploy", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();

      const treasuryAddress = await spaceCoin.treasuryAddress();
      expect(treasuryAddress).to.equal(treasuryAccount.address);
    });

    it("sets the ICO address on deploy", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();

      const icoAddress = await spaceCoin.icoAddress();
      expect(icoAddress).to.equal(icoAccount.address);
    });
  });

  describe("ownership", () => {
    it("instantiates a new contract with owner", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();
      const owner = await spaceCoin.owner();
      expect(owner).to.equal(account1.address);
    });

    it("transfers ownership", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();
      const transferOwnershipTxn = await spaceCoin.transferOwnership(
        account2.address
      );
      expect(transferOwnershipTxn)
        .to.emit(spaceCoin, "OwnershipTransferred")
        .withArgs(account1.address, account2.address);
    });

    it("throws error when non-owner attempts transfer", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();

      let error;
      try {
        await spaceCoin.connect(account2).transferOwnership(account2.address);
      } catch (newError) {
        error = newError;
      }

      expect(
        String(error).indexOf("Ownable: caller is not the owner") > -1
      ).to.equal(true);
    });

    it("renounces ownership", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();
      const renounceOwnershipTxn = spaceCoin.renounceOwnership();
      expect(renounceOwnershipTxn)
        .to.emit(spaceCoin, "OwnershipTransferred")
        .withArgs(
          account1.address,
          "0x0000000000000000000000000000000000000000"
        );
    });

    it("throws error when non-owner attempts renouncing ownership", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();

      let error;
      try {
        await spaceCoin.connect(account2).renounceOwnership();
      } catch (newError) {
        error = newError;
      }

      expect(
        String(error).indexOf("Ownable: caller is not the owner") > -1
      ).to.equal(true);
    });
  });

  describe("toggleIsTaxingTokens", () => {
    it("toggles the ability to tax tokens", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();

      let isTaxingTokens = await spaceCoin.isTaxingTokens();
      expect(isTaxingTokens).to.equal(true);

      await spaceCoin.toggleIsTaxingTokens();
      isTaxingTokens = await spaceCoin.isTaxingTokens();
      expect(isTaxingTokens).to.equal(false);

      await spaceCoin.toggleIsTaxingTokens();
      isTaxingTokens = await spaceCoin.isTaxingTokens();
      expect(isTaxingTokens).to.equal(true);
    });

    it("throws an error if a non-owner address calls it", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();

      let error;
      try {
        await spaceCoin.connect(account3).toggleIsTaxingTokens();
      } catch (newError) {
        error = newError;
      }

      expect(
        String(error).indexOf("Ownable: caller is not the owner") > -1
      ).to.equal(true);
    });
  });

  describe("updateTreasuryAddress", () => {
    it("allows the updating of the treasury address", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();

      let currentTreasuryAddress = await spaceCoin.treasuryAddress();
      expect(currentTreasuryAddress).to.equal(treasuryAccount.address);

      await spaceCoin.updateTreasuryAddress(account3.address);
      currentTreasuryAddress = await spaceCoin.treasuryAddress();
      expect(currentTreasuryAddress).to.equal(account3.address);
    });

    it("throws an error if a non-owner address calls it", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();

      let error;
      try {
        await spaceCoin
          .connect(account3)
          .updateTreasuryAddress(account3.address);
      } catch (newError) {
        error = newError;
      }

      expect(
        String(error).indexOf("Ownable: caller is not the owner") > -1
      ).to.equal(true);
    });

    it("throws an error is the new address is address 0", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();

      let error;
      try {
        await spaceCoin
          .connect(account1)
          .updateTreasuryAddress("0x0000000000000000000000000000000000000000");
      } catch (newError) {
        error = newError;
      }

      expect(
        String(error).indexOf("SpaceCoin: address must not be 0") > -1
      ).to.equal(true);
    });
  });

  describe("transfer", () => {
    it("taxes every transfer of tokens if isTaxingTokens is true", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();

      await spaceCoin
        .connect(icoAccount)
        .transfer(account1.address, ethers.utils.parseEther("1"));

      const account1Balance = await spaceCoin.balanceOf(account1.address);
      expect(account1Balance).to.equal(ethers.utils.parseEther("0.98"));

      const treasuryBalance = await spaceCoin.balanceOf(
        treasuryAccount.address
      );
      expect(treasuryBalance).to.equal(ethers.utils.parseEther("0.02"));
    });

    it("does not tax transfers of tokens if isTaxingTokens is false", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();
      await spaceCoin.toggleIsTaxingTokens();

      await spaceCoin
        .connect(icoAccount)
        .transfer(account1.address, ethers.utils.parseEther("1"));

      const account1Balance = await spaceCoin.balanceOf(account1.address);
      expect(account1Balance).to.equal(ethers.utils.parseEther("1"));

      const treasuryBalance = await spaceCoin.balanceOf(
        treasuryAccount.address
      );
      expect(treasuryBalance).to.equal(ethers.utils.parseEther("0"));
    });

    it("throws an error when trying to transfer an amount of 0", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();
      await spaceCoin.toggleIsTaxingTokens();

      let error;
      try {
        await spaceCoin.connect(icoAccount).transfer(account1.address, 0);
      } catch (newError) {
        error = newError;
      }

      expect(
        String(error).indexOf("SpaceCoin: must be valid amount") > -1
      ).to.equal(true);
    });
  });
});
