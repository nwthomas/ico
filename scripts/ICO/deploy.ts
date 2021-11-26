import { ethers } from "hardhat";

async function main() {
  const ICOContractFactory = await ethers.getContractFactory("ICO");

  // Deploy contract to blockchain
  // const icoContract = await ICOContractFactory.deploy();
  // await icoContract.deployed();
  // console.log("ICO deployed to:", icoContract.address);

  // Initialize contract
  // const icoContract = await ICOContractFactory.attach(
  //   "0x4F1DB9c3f63118d0A0Dd20172203aad2380A2996"
  // );
  // await icoContract.initialize("0xA0D72F7b84Df1BFd689aEDFbE5ca845777380b55");
  // console.log(await icoContract.tokenAddress());

  // Approve address for seed investment
  // const icoContract = await ICOContractFactory.attach(
  //   "0x4F1DB9c3f63118d0A0Dd20172203aad2380A2996"
  // );
  // await icoContract.toggleSeedInvestor(
  //   "0xd840826a87b9f246db5999604440ca067bdd9ffd"
  // );

  // Progress phases forward
  const icoContract = await ICOContractFactory.attach(
    "0x4F1DB9c3f63118d0A0Dd20172203aad2380A2996"
  );
  const progressPhasesTxn = await icoContract.progressPhases();
  await progressPhasesTxn.wait();
  console.log(await icoContract.currentPhase());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
