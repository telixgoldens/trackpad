const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 1. Deploy the Mock Gateway (The "Fake" Bridge)
  const MockGateway = await hre.ethers.getContractFactory("MockGateway");
  const mockGateway = await MockGateway.deploy();
  await mockGateway.waitForDeployment();
  const mockGatewayAddr = await mockGateway.getAddress();
  console.log("✅ MockGateway deployed to:", mockGatewayAddr);

  // 2. Deploy the Router
  const feeRecipient = deployer.address; // Fees go to you
  const Router = await hre.ethers.getContractFactory("TrackpadCrossChainRouter");
  const router = await Router.deploy(feeRecipient);
  await router.waitForDeployment();
  const routerAddr = await router.getAddress();
  console.log("✅ TrackpadRouter deployed to:", routerAddr);

  // 3. Whitelist the Mock Gateway
  // This tells your Router: "It is safe to send money to the MockGateway"
  const tx = await router.setGatewayAllowed(mockGatewayAddr, true);
  await tx.wait();
  console.log("🔓 MockGateway successfully whitelisted!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});