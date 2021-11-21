import { ethers } from "hardhat";

async function main() {
  const [, account2, treasuryAddress, icoAddress] = await ethers.getSigners();
  const SpaceCoinFactory = await ethers.getContractFactory("SpaceCoin");
  const spaceCoin = await SpaceCoinFactory.deploy(
    treasuryAddress.address,
    icoAddress.address
  );
  await spaceCoin.deployed();
  console.log("Project deployed to:", spaceCoin.address);

  console.log(
    ethers.utils.formatEther(await spaceCoin.balanceOf(icoAddress.address))
  );

  await spaceCoin
    .connect(icoAddress)
    .transfer(account2.address, ethers.utils.parseEther("100.100"));

  console.log(
    ethers.utils.formatEther(await spaceCoin.balanceOf(icoAddress.address))
  );
  console.log(
    ethers.utils.formatEther(await spaceCoin.balanceOf(treasuryAddress.address))
  );
  console.log(
    ethers.utils.formatEther(await spaceCoin.balanceOf(account2.address))
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
