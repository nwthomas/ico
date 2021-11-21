import { ethers } from "hardhat";

async function main() {
  const [, treasuryAddress, icoAddress] = await ethers.getSigners();
  const ICOContractFactory = await ethers.getContractFactory("SpaceCoin");
  const icoContract = await ICOContractFactory.deploy(
    treasuryAddress.address,
    icoAddress.address
  );
  await icoContract.deployed();
  console.log("ICO deployed to:", icoContract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
