const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const MockGateway = await hre.ethers.getContractFactory("MockGateway");
  const mockGateway = await MockGateway.deploy();
  await mockGateway.waitForDeployment();
  const mockGatewayAddr = await mockGateway.getAddress();
  console.log(" MockGateway deployed to:", mockGatewayAddr);

  const feeRecipient = deployer.address; 
  const Router = await hre.ethers.getContractFactory("TrackpadCrossChainRouter");
  const router = await Router.deploy(feeRecipient);
  await router.waitForDeployment();
  const routerAddr = await router.getAddress();
  console.log("TrackpadRouter deployed to:", routerAddr);

  const tx = await router.setGatewayAllowed(mockGatewayAddr, true);
  await tx.wait();
  console.log(" MockGateway successfully whitelisted!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});