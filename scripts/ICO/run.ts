import { ethers } from "hardhat";

async function main() {
  const ICOContractFactory = await ethers.getContractFactory("ICO");
  const icoContract = await ICOContractFactory.deploy();
  await icoContract.deployed();
  console.log("ICO deployed to:", icoContract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
