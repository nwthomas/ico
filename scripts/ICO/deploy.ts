import { ethers } from "hardhat";

async function main() {
  const ICOContractFactory = await ethers.getContractFactory("ICO");
  // const icoContract = await ICOContractFactory.deploy();
  // await icoContract.deployed();
  // console.log("ICO deployed to:", icoContract.address);
  const icoContract = await ICOContractFactory.attach(
    "0xcBEabff9B256e95441f52a81789E4A7077A85A55"
  );
  await icoContract.initialize("0x984deeC0cF369a4A64a6550779A8e1502b52b1A6");
  console.log(await icoContract.tokenAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
