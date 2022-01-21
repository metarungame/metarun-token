module.exports = async function ({ ethers, getNamedAccounts, deployments, hre }) {
  const { deploy, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const TierSystem = require("../contracts/artifacts/TierSystem.json");
  const IDOCreator = require("../contracts/artifacts/IDOCreator.json");
  const IDOMaster = require("../contracts/artifacts/IDOMaster.json");
  const ERC20Basic = require("../contracts/artifacts/ERC20Basic.json");
  const IDOPool = require("../contracts/artifacts/IDOPool.json");

  const hasWhitelisting = false;
  const enableTierSystem = true;

  // IDO time and economic boundaries
  const amount = ethers.utils.parseEther("10000000"); // MRUN
  const tokenPrice = ethers.utils.parseEther("0.000001"); // MATIC
  const minEthPayment = ethers.utils.parseEther("0.000001"); // MATIC
  const maxEthPayment = ethers.utils.parseEther("0.1"); // MATIC
  const maxDistributedTokenAmount = amount;
  const startTimestamp = 1642784400 // 2022-01-21T17:00:00+00:00
  const finishTimestamp = 1642870800 // 2022-01-22T17:00:00+00:00
  const startClaimTimestamp = finishTimestamp;

  hardhatChainId = ethers.provider._hardhatProvider._provider._chainId;
  backupChainId = 80001;
  const chainId = hardhatChainId ?  hardhatChainId : backupChainId;
  
  console.log("Loading periphery contracts for chainID", chainId);
  this.tierSystem = await ethers.getContractAt(TierSystem.abi, TierSystem.networks[chainId.toString()].address);
  console.log("  TierSystem", this.tierSystem.address);
  this.idoCreator = await ethers.getContractAt(IDOCreator.abi, IDOCreator.networks[chainId.toString()].address);
  console.log("  IDOCreator", this.idoCreator.address);
  this.idoMaster = await ethers.getContractAt(IDOMaster.abi, IDOMaster.networks[chainId.toString()].address);
  console.log("  IDOMaster", this.idoMaster.address);
  this.IdoPoolFactory = await ethers.getContractFactory(IDOPool.abi, IDOPool.bytecode);

  const token = await deployments.get("MetarunToken");

  await execute(
    'MetarunToken',
    { from: deployer, log: true },
    'mint',
    deployer,
    amount
  );

  await execute(
    'MetarunToken',
    { from: deployer, log: true },
    'approve',
    this.idoCreator.address,
    amount
  );

  const tx = await this.idoCreator.createIDO(
    tokenPrice,
    token.address,
    startTimestamp,
    finishTimestamp,
    startClaimTimestamp,
    minEthPayment,
    maxEthPayment,
    maxDistributedTokenAmount,
    hasWhitelisting,
    enableTierSystem,
  );
  console.log("Sent Tx:", tx.hash);
  const txReceipt = await tx.wait();
  if (txReceipt.logs.length == 0) {
    console.log("Ido creation failed. It's expected if IDO creator not deployed.");
    return;
  }
  idoPoolAddress = this.idoMaster.interface.parseLog(txReceipt.logs[4]).args.idoPool;
  console.log("IDOPool created:", idoPoolAddress);
  this.idoPool = await ethers.getContractAt(IDOPool.abi, idoPoolAddress);
};

module.exports.tags = ["CreateIDO"];
module.exports.dependencies = ["MetarunToken"];
