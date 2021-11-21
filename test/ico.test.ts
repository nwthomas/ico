import chai from "chai";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { solidity } from "ethereum-waffle";
import { ethers } from "hardhat";
const { expect } = chai;

chai.use(solidity);

describe("ICO", () => {
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

  const getDeployedICOContract = async () => {
    const contractFactory = await ethers.getContractFactory("ICO");
    const contract = await contractFactory.deploy();

    return contract;
  };

  beforeEach(async () => {
    const [owner, second, third, treasuryAddress, icoAddress] =
      await ethers.getSigners();

    account1 = owner;
    account2 = second;
    account3 = third;
    treasuryAccount = treasuryAddress;
    icoAccount = icoAddress;
  });

  describe("ownership", () => {
    it("instantiates a new contract with owner", async () => {
      const icoContract = await getDeployedICOContract();
      const owner = await icoContract.owner();
      expect(owner).to.equal(account1.address);
    });

    it("transfers ownership", async () => {
      const icoContract = await getDeployedICOContract();
      const transferOwnershipTxn = await icoContract.transferOwnership(
        account2.address
      );
      expect(transferOwnershipTxn)
        .to.emit(icoContract, "OwnershipTransferred")
        .withArgs(account1.address, account2.address);
    });

    it("throws error when non-owner attempts transfer", async () => {
      const icoContract = await getDeployedICOContract();

      let error;
      try {
        await icoContract.connect(account3).transferOwnership(account2.address);
      } catch (newError) {
        error = newError;
      }

      expect(
        String(error).indexOf("Ownable: caller is not the owner") > -1
      ).to.equal(true);
    });

    it("renounces ownership", async () => {
      const icoContract = await getDeployedICOContract();

      const renounceOwnershipTxn = icoContract.renounceOwnership();
      expect(renounceOwnershipTxn)
        .to.emit(icoContract, "OwnershipTransferred")
        .withArgs(
          account1.address,
          "0x0000000000000000000000000000000000000000"
        );
    });

    it("throws error when non-owner attempts renouncing ownership", async () => {
      const icoContract = await getDeployedICOContract();

      let error;
      try {
        await icoContract.connect(account2).renounceOwnership();
      } catch (newError) {
        error = newError;
      }

      expect(
        String(error).indexOf("Ownable: caller is not the owner") > -1
      ).to.equal(true);
    });
  });

  describe("buyTokens", () => {
    // finish
  });

  describe("claimTokens", () => {
    // finish
  });

  describe("initialize", () => {
    it("allows the owner to initialized the contract with the token address", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);

      const icoAddressTxn = await icoContract.tokenAddress();
      expect(icoAddressTxn).to.equal(spaceCoinContract.address);
    });

    it("sets the isInitialized variable to true", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);

      const isInitializedTxn = await icoContract.isInitialized();
      expect(isInitializedTxn).to.equal(true);
    });

    it("throws error if a non-owner address calls it", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();

      let error;
      try {
        await icoContract
          .connect(account2)
          .initialize(spaceCoinContract.address);
      } catch (newError) {
        error = newError;
      }

      expect(
        String(error).indexOf("Ownable: caller is not the owner") > -1
      ).to.equal(true);
    });

    it("throws error if the treasury address is 0x0", async () => {
      const icoContract = await getDeployedICOContract();

      let error;
      try {
        await icoContract.initialize(
          "0x0000000000000000000000000000000000000000"
        );
      } catch (newError) {
        error = newError;
      }

      expect(String(error).indexOf("ICO: address must be valid") > -1).to.equal(
        true
      );
    });
  });

  describe("progressPhases", () => {
    // finish
  });

  describe("toggleIsPaused", () => {
    it("deploys with isPaused set to false", async () => {
      const icoContract = await getDeployedICOContract();

      const isPausedTxn = await icoContract.isPaused();
      expect(isPausedTxn).to.equal(false);
    });

    it("allows the pausing and unpausing of the contract", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);

      await icoContract.toggleIsPaused();
      let isPausedTxn = await icoContract.isPaused();
      expect(isPausedTxn).to.equal(true);

      await icoContract.toggleIsPaused();
      isPausedTxn = await icoContract.isPaused();
      expect(isPausedTxn).to.equal(false);
    });

    it("throws an error if called by a non-owner address", async () => {
      const icoContract = await getDeployedICOContract();

      let error;
      try {
        await icoContract.connect(account2).toggleIsPaused();
      } catch (newError) {
        error = newError;
      }

      expect(
        String(error).indexOf("Ownable: caller is not the owner") > -1
      ).to.equal(true);
    });
  });

  describe("toggleSeedInvestor", () => {
    it("allows an address to be turned on as a seed investor", async () => {
      const icoContract = await getDeployedICOContract();

      await icoContract.toggleSeedInvestor(account2.address);
      const isSeedInvestorTxn = await icoContract.approvedSeedInvestors(
        account2.address
      );
      expect(isSeedInvestorTxn).to.equal(true);
    });

    it("allows an address to be turned off as a seed investor", async () => {
      const icoContract = await getDeployedICOContract();

      await icoContract.toggleSeedInvestor(account2.address);
      await icoContract.toggleSeedInvestor(account2.address);
      const isSeedInvestorTxn = await icoContract.approvedSeedInvestors(
        account2.address
      );
      expect(isSeedInvestorTxn).to.equal(false);
    });

    it("throws an error if a non-owner address calls it", async () => {
      const icoContract = await getDeployedICOContract();

      let error;
      try {
        await icoContract
          .connect(account3)
          .toggleSeedInvestor(account2.address);
      } catch (newError) {
        error = newError;
      }

      expect(
        String(error).indexOf("Ownable: caller is not the owner") > -1
      ).to.equal(true);
    });
  });

  describe("receive", () => {
    it("throws an error when attempting to pay with receive method", async () => {
      const icoContract = await getDeployedICOContract();

      let error;
      try {
        await account3.sendTransaction({
          to: icoContract.address,
          value: ethers.utils.parseEther("1"),
        });
      } catch (newError) {
        error = newError;
      }

      expect(
        String(error).indexOf("ICO: use buyTokens function") > -1
      ).to.equal(true);
    });
  });
});
