import { ethers } from "hardhat";

// Set these before deploy
const TREASURY_ADDRESS = "0xD840826A87b9f246Db5999604440Ca067BDD9FFd";
const ICO_ADDRESS = "0xcBEabff9B256e95441f52a81789E4A7077A85A55";

async function main() {
  const SpaceCoinFactory = await ethers.getContractFactory("SpaceCoin");
  const spaceCoin = await SpaceCoinFactory.deploy(
    TREASURY_ADDRESS,
    ICO_ADDRESS
  );
  await spaceCoin.deployed();
  console.log("SpaceCoin deployed to:", spaceCoin.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
