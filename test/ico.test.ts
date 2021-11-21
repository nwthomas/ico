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
  let remainingAccounts: SignerWithAddress[];

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
    const [
      owner,
      second,
      third,
      treasuryAddress,
      icoAddress,
      ...remainingAddresses
    ] = await ethers.getSigners();

    account1 = owner;
    account2 = second;
    account3 = third;
    treasuryAccount = treasuryAddress;
    icoAccount = icoAddress;
    remainingAccounts = remainingAddresses;
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
    it("allows addresses to invest funds in the ICO", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);

      await icoContract
        .connect(account2)
        .buyTokens({ value: ethers.utils.parseEther("10") });

      const addressContributions = await icoContract.addressToContributions(
        account2.address
      );
      expect(addressContributions).to.equal(ethers.utils.parseEther("10"));
    });

    it("allows multiple addresses to contribute", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);

      await icoContract.buyTokens({ value: ethers.utils.parseEther("10") });

      await icoContract
        .connect(account2)
        .buyTokens({ value: ethers.utils.parseEther("10") });

      await icoContract
        .connect(account3)
        .buyTokens({ value: ethers.utils.parseEther("10") });

      const totalContributionsTxn = await icoContract.totalContributions();
      expect(totalContributionsTxn).to.equal(ethers.utils.parseEther("30"));
    });

    it("throws error is contract is not initialized", async () => {
      const icoContract = await getDeployedICOContract();

      let error;
      try {
        await icoContract
          .connect(account2)
          .buyTokens({ value: ethers.utils.parseEther("10") });
      } catch (newError) {
        error = newError;
      }

      expect(String(error).indexOf("ICO: not initialized") > -1).to.equal(true);
    });

    it("throws error if ICO is paused", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);

      await icoContract.toggleIsPaused();

      let error;
      try {
        await icoContract.buyTokens({ value: ethers.utils.parseEther("10") });
      } catch (newError) {
        error = newError;
      }

      expect(String(error).indexOf("ICO: the ICO is paused") > -1).to.equal(
        true
      );
    });

    it("emits an event", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);

      const buyTokenTxn = await icoContract.buyTokens({
        value: ethers.utils.parseEther("10"),
      });
      expect(buyTokenTxn)
        .to.emit(icoContract, "NewInvestment")
        .withArgs(account1.address, ethers.utils.parseEther("10"));
    });

    it("increases address contributions in tracker mapping", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);

      await icoContract.buyTokens({
        value: ethers.utils.parseEther("10"),
      });

      const addressContributionsTxn = await icoContract.addressToContributions(
        account1.address
      );
      expect(addressContributionsTxn).to.equal(ethers.utils.parseEther("10"));
    });

    it("throws error if contributions are higher than individual cap in seed phase", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);

      for (let i = 0; i < 15; i++) {
        await remainingAccounts[i].sendTransaction({
          to: account1.address,
          value: ethers.utils.parseEther("100"),
        });
      }

      await icoContract.buyTokens({
        value: ethers.utils.parseEther("1500"),
      });

      let error;
      try {
        await icoContract.buyTokens({
          value: ethers.utils.parseEther("0.01"),
        });
      } catch (newError) {
        error = newError;
      }

      expect(
        String(error).indexOf("ICO: contribution maximum reached") > -1
      ).to.equal(true);
    });

    it("throws error if contributions are higher than phase cap in seed phase", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);

      for (let i = 0; i < 150; i++) {
        await icoContract.connect(remainingAccounts[i]).buyTokens({
          value: ethers.utils.parseEther("100"),
        });
      }

      let error;
      try {
        await icoContract.buyTokens({
          value: ethers.utils.parseEther("0.01"),
        });
      } catch (newError) {
        error = newError;
      }

      expect(
        String(error).indexOf("ICO: phase contributions reached") > -1
      ).to.equal(true);
    });

    it("throws error if contributions are higher than individual cap in general phase", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);
      await icoContract.progressPhases();

      for (let i = 0; i < 10; i++) {
        await remainingAccounts[i].sendTransaction({
          to: account1.address,
          value: ethers.utils.parseEther("100"),
        });
      }

      await icoContract.buyTokens({
        value: ethers.utils.parseEther("1000"),
      });

      let error;
      try {
        await icoContract.buyTokens({
          value: ethers.utils.parseEther("0.01"),
        });
      } catch (newError) {
        error = newError;
      }

      expect(
        String(error).indexOf("ICO: contribution maximum reached") > -1
      ).to.equal(true);
    });

    it("throws error if contributions are higher than phase cap in general phase", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);
      await icoContract.progressPhases();

      for (let i = 0; i < 300; i++) {
        await icoContract.connect(remainingAccounts[i]).buyTokens({
          value: ethers.utils.parseEther("100"),
        });
      }

      let error;
      try {
        await icoContract.buyTokens({
          value: ethers.utils.parseEther("0.01"),
        });
      } catch (newError) {
        error = newError;
      }

      expect(
        String(error).indexOf("ICO: phase contributions reached") > -1
      ).to.equal(true);
    });

    it("sends excess ether back if msg.value + past contributions > individual cap", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);

      for (let i = 0; i < 15; i++) {
        await remainingAccounts[i].sendTransaction({
          to: account1.address,
          value: ethers.utils.parseEther("100"),
        });
      }

      await icoContract.buyTokens({
        value: ethers.utils.parseEther("1499"),
      });

      const refundTxn = await icoContract.buyTokens({
        value: ethers.utils.parseEther("100"),
      });
      expect(refundTxn)
        .to.emit(icoContract, "Refund")
        .withArgs(account1.address, ethers.utils.parseEther("99"));

      const addressToContributionsTxn =
        await icoContract.addressToContributions(account1.address);
      expect(addressToContributionsTxn).to.equal(
        ethers.utils.parseEther("1500")
      );
    });

    it("sends excess ether back if msg.value + total contributions > phase cap", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);

      for (let i = 0; i < 150; i++) {
        await icoContract.connect(remainingAccounts[i]).buyTokens({
          value: ethers.utils.parseEther(i !== 149 ? "100" : "99"),
        });
      }

      const refundTxn = await icoContract.buyTokens({
        value: ethers.utils.parseEther("100"),
      });
      expect(refundTxn)
        .to.emit(icoContract, "Refund")
        .withArgs(account1.address, ethers.utils.parseEther("99"));

      const totalContributionsTxn = await icoContract.totalContributions();
      expect(totalContributionsTxn).to.equal(ethers.utils.parseEther("15000"));
    });
  });

  describe("claimTokens", () => {
    it("transfers tokens to valid address in correct amount", async () => {
      // finish
    });

    it("emits event on transfer", async () => {
      // finish
    });

    it("throws error if address has not contributions", async () => {
      // finish
    });

    it("throws error if contract is not initialized", async () => {
      const icoContract = await getDeployedICOContract();

      let error;
      try {
        await icoContract.claimTokens();
      } catch (newError) {
        error = newError;
      }

      expect(String(error).indexOf("ICO: not initialized") > -1).to.equal(true);
    });

    it("throws error if not in open phase", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);

      let error;
      try {
        await icoContract.claimTokens();
      } catch (newError) {
        error = newError;
      }

      expect(String(error).indexOf("ICO: not open phase") > -1).to.equal(true);
    });
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
    it("allows progressing phases", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);

      let currentPhaseTxn = await icoContract.currentPhase();
      expect(currentPhaseTxn).to.equal(0); // SEED

      await icoContract.progressPhases();
      currentPhaseTxn = await icoContract.currentPhase();
      expect(currentPhaseTxn).to.equal(1); // GENERAL

      await icoContract.progressPhases();
      currentPhaseTxn = await icoContract.currentPhase();
      expect(currentPhaseTxn).to.equal(2); // OPEN
    });

    it("throws if an attempt is made to progress past open phase", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);

      await icoContract.progressPhases();
      await icoContract.progressPhases();

      let error;
      try {
        await icoContract.progressPhases();
      } catch (newError) {
        error = newError;
      }

      expect(String(error).indexOf("ICO: phases complete") > -1).to.equal(true);
    });

    it("throws error if non-owner address calls it", async () => {
      const icoContract = await getDeployedICOContract();
      const spaceCoinContract = await getDeployedSpaceCoinContract();
      await icoContract.initialize(spaceCoinContract.address);

      let error;
      try {
        await icoContract.connect(account3).progressPhases();
      } catch (newError) {
        error = newError;
      }

      expect(
        String(error).indexOf("Ownable: caller is not the owner") > -1
      ).to.equal(true);
    });

    it("throws error if contract is not initialized", async () => {
      const icoContract = await getDeployedICOContract();

      let error;
      try {
        await icoContract.progressPhases();
      } catch (newError) {
        error = newError;
      }

      expect(String(error).indexOf("ICO: not initialized") > -1).to.equal(true);
    });
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
