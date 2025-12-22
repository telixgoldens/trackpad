const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const feeRecipient = deployer.address;

  const Router = await hre.ethers.getContractFactory("TrackpadCrossChainRouter");
  const router = await Router.deploy(feeRecipient);
  await router.waitForDeployment();
  const routerAddr = await router.getAddress();
  
  console.log("TrackpadRouter deployed to:", routerAddr);

  const networkName = hre.network.name;
  let gatewayToWhitelist;

  if (networkName === "baseMainnet") {
      gatewayToWhitelist = "0x12E6e5fe91C1C88F3f69542718E3406C62280156"; 
  } else if (networkName === "mantleMainnet") {
      gatewayToWhitelist = "0x3a23F943181408EAC424116Af7b7790c94Cb97a5";
  } else {
      console.log("Testnet/Localhost detected. Deploying MockGateway...");
      const MockGateway = await hre.ethers.getContractFactory("MockGateway");
      const mockGateway = await MockGateway.deploy();
      await mockGateway.waitForDeployment();
      gatewayToWhitelist = await mockGateway.getAddress();
      console.log("MockGateway deployed to:", gatewayToWhitelist);
  }

  console.log(`Whitelisting gateway: ${gatewayToWhitelist}...`);
  const tx = await router.setGatewayAllowed(gatewayToWhitelist, true);
  await tx.wait();
  console.log("Gateway successfully whitelisted!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});