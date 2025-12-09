const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment to", hre.network.name);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  
  // Deploy BountyEscrow
  console.log("\n1. Deploying BountyEscrow...");
  const BountyEscrow = await hre.ethers.getContractFactory("BountyEscrow");
  const bountyEscrow = await BountyEscrow.deploy();
  await bountyEscrow.waitForDeployment();
  
  const escrowAddress = await bountyEscrow.getAddress();
  console.log("BountyEscrow deployed to:", escrowAddress);
  
  // Set up initial configuration
  console.log("\n2. Setting up initial configuration...");
  
  // Get bot wallet address from environment or use deployer as default
  const botWalletAddress = process.env.BOT_WALLET_ADDRESS || deployer.address;
  console.log("Bot wallet address:", botWalletAddress);
  
  // Authorize bot wallet
  console.log("Authorizing bot wallet...");
  const authorizeTx = await bountyEscrow.authorizeBot(botWalletAddress);
  await authorizeTx.wait();
  console.log("Bot wallet authorized");
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    contracts: {
      BountyEscrow: {
        address: escrowAddress
      }
    },
    configuration: {
      botWallet: botWalletAddress,
      note: "MNEE payments are handled via MNEE API, not through smart contracts"
    }
  };
  
  // Save to file
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const fileName = `${hre.network.name}-deployment.json`;
  const filePath = path.join(deploymentsDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${filePath}`);
  
  // Verify contracts on Etherscan if not on localhost
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\n3. Verifying contracts on Etherscan...");
    
    // Wait a bit for Etherscan to index the contracts
    console.log("Waiting 30 seconds for Etherscan to index contracts...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
      console.log("Verifying BountyEscrow...");
      await hre.run("verify:verify", {
        address: escrowAddress,
        constructorArguments: [],
      });
      console.log("BountyEscrow verified");
    } catch (error) {
      console.log("Verification failed:", error.message);
      console.log("You can verify manually using:");
      console.log(`npx hardhat verify --network ${hre.network.name} ${escrowAddress}`);
    }
  }
  
  // Print summary
  console.log("\n========== Deployment Summary ==========");
  console.log("Network:", hre.network.name);
  console.log("BountyEscrow:", escrowAddress);
  console.log("Bot Wallet:", botWalletAddress);
  console.log("=======================================");
  
  // Print next steps
  console.log("\nNext steps:");
  console.log("1. Update bot .env file with contract address:");
  console.log(`   BOUNTY_ESCROW_ADDRESS=${escrowAddress}`);
  console.log("2. Configure MNEE API credentials in bot .env:");
  console.log("   MNEE_ENVIRONMENT=production (or sandbox for testing)");
  console.log("   MNEE_API_KEY=your_api_key");
  console.log("   MNEE_BOT_ADDRESS=your_mnee_wallet_address");
  console.log("   MNEE_BOT_WIF=your_mnee_wallet_private_key");
  console.log("3. Ensure bot's MNEE wallet has sufficient MNEE balance");
  console.log("4. Fund the bot's Ethereum wallet with ETH for gas fees");
  console.log("5. Configure the GitHub bot with these addresses");
  console.log("6. Deploy the GitHub Action to repositories");
  
  console.log("\nNote: This deployment uses a hybrid approach:");
  console.log("- Smart contracts manage bounty states and authorization");
  console.log("- MNEE payments are handled through the MNEE API");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });