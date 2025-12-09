const hre = require("hardhat");

async function main() {
  console.log("Starting local deployment...");
  
  const [deployer, bot, user1, user2] = await hre.ethers.getSigners();
  
  console.log("Deployer:", deployer.address);
  console.log("Bot wallet:", bot.address);
  console.log("Test user 1:", user1.address);
  console.log("Test user 2:", user2.address);
  
  // Deploy BountyEscrow
  console.log("\n1. Deploying BountyEscrow...");
  const BountyEscrow = await hre.ethers.getContractFactory("BountyEscrow");
  const bountyEscrow = await BountyEscrow.deploy();
  await bountyEscrow.waitForDeployment();
  
  const escrowAddress = await bountyEscrow.getAddress();
  console.log("BountyEscrow deployed to:", escrowAddress);
  
  // Authorize bot wallet
  console.log("\n2. Authorizing bot wallet...");
  await bountyEscrow.authorizeBot(bot.address);
  console.log("Bot wallet authorized");
  
  // Create some test bounties
  console.log("\n3. Creating test bounties...");
  
  // Bounty 1: Small bounty (50 MNEE)
  const tx1 = await bountyEscrow.connect(bot).createBounty(
    "test-org/test-repo",
    1,
    50,
    150,
    "https://github.com/test-org/test-repo/issues/1"
  );
  await tx1.wait();
  console.log("Created bounty 1: 50 MNEE (max 150 MNEE)");
  
  // Bounty 2: Medium bounty (100 MNEE)
  const tx2 = await bountyEscrow.connect(bot).createBounty(
    "test-org/test-repo",
    2,
    100,
    300,
    "https://github.com/test-org/test-repo/issues/2"
  );
  await tx2.wait();
  console.log("Created bounty 2: 100 MNEE (max 300 MNEE)");
  
  // Bounty 3: Large bounty (500 MNEE)
  const tx3 = await bountyEscrow.connect(bot).createBounty(
    "test-org/another-repo",
    10,
    500,
    1000,
    "https://github.com/test-org/another-repo/issues/10"
  );
  await tx3.wait();
  console.log("Created bounty 3: 500 MNEE (max 1000 MNEE)");
  
  // Print contract addresses for .env
  console.log("\n========== Local Deployment Complete ==========");
  console.log("Add these to your bot .env file:");
  console.log(`BOUNTY_ESCROW_ADDRESS=${escrowAddress}`);
  console.log(`BOT_WALLET_ADDRESS=${bot.address}`);
  console.log(`BOT_WALLET_PRIVATE_KEY=${bot.privateKey}`);
  console.log("\nFor MNEE testing in sandbox mode:");
  console.log("MNEE_ENVIRONMENT=sandbox");
  console.log("MNEE_API_KEY=your_sandbox_api_key");
  console.log("MNEE_BOT_ADDRESS=your_sandbox_mnee_address");
  console.log("MNEE_BOT_WIF=your_sandbox_mnee_private_key");
  console.log("\nTest wallets for development:");
  console.log(`User 1: ${user1.address}`);
  console.log(`User 2: ${user2.address}`);
  console.log("=============================================");
  
  // Get contract stats
  const stats = await bountyEscrow.getStats();
  console.log("\nContract Stats:");
  console.log("Total bounties:", stats.totalBounties.toString());
  console.log("Active bounties:", stats.activeBounties.toString());
  console.log("Claimed bounties:", stats.claimedBounties.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });