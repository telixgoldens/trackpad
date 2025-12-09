const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Address that will receive fees (You can change this to your own wallet address)
  const feeRecipient = deployer.address; 

  const Router = await hre.ethers.getContractFactory("TrackpadCrossChainRouter");
  const router = await Router.deploy(feeRecipient);

  await router.waitForDeployment();

  const address = await router.getAddress();

  console.log("TrackpadRouter deployed to:", address);
  
  // Whitelist a "Mock" gateway so we can test it immediately
  // (In production, this would be the real Bungee Gateway address)
  const mockGateway = "0x0000000000000000000000000000000000000000";
  await router.setGatewayAllowed(mockGateway, true);
  console.log("Mock Gateway whitelisted:", mockGateway);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});