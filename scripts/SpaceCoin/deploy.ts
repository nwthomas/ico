import { ethers } from "hardhat";

// Set these before deploy
const TREASURY_ADDRESS = "0xD840826A87b9f246Db5999604440Ca067BDD9FFd";
const ICO_ADDRESS = "0x4F1DB9c3f63118d0A0Dd20172203aad2380A2996";

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
