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

  const getDeployedICOContract = async (tokenAddress: string) => {
    const contractFactory = await ethers.getContractFactory("ICO");
    const contract = await contractFactory.deploy(tokenAddress);

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
      const spaceCoin = await getDeployedSpaceCoinContract();
      const icoContract = await getDeployedICOContract(spaceCoin.address);
      const owner = await icoContract.owner();
      expect(owner).to.equal(account1.address);
    });

    it("transfers ownership", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();
      const icoContract = await getDeployedICOContract(spaceCoin.address);
      const transferOwnershipTxn = await icoContract.transferOwnership(
        account2.address
      );
      expect(transferOwnershipTxn)
        .to.emit(icoContract, "OwnershipTransferred")
        .withArgs(account1.address, account2.address);
    });

    it("throws error when non-owner attempts transfer", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();
      const icoContract = await getDeployedICOContract(spaceCoin.address);

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
      const spaceCoin = await getDeployedSpaceCoinContract();
      const icoContract = await getDeployedICOContract(spaceCoin.address);

      const renounceOwnershipTxn = icoContract.renounceOwnership();
      expect(renounceOwnershipTxn)
        .to.emit(icoContract, "OwnershipTransferred")
        .withArgs(
          account1.address,
          "0x0000000000000000000000000000000000000000"
        );
    });

    it("throws error when non-owner attempts renouncing ownership", async () => {
      const spaceCoin = await getDeployedSpaceCoinContract();
      const icoContract = await getDeployedICOContract(spaceCoin.address);

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
});
