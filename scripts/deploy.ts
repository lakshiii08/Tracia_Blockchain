
import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("=================================================");
  console.log("  EvidenceRegistry Smart Contract Deployment");
  console.log("=================================================\n");

  // Connect to the configured Hardhat network
  const { ethers } = await network.connect();

  const signers = await ethers.getSigners();

  if (signers.length === 0) {
    throw new Error(
      "No deployer account found. Check your Hardhat network configuration and private key."
    );
  }

  const deployer = signers[0];

  console.log(`Deploying using account: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} POL\n`);

  if (balance === 0n) {
    throw new Error(
      "Deployer has 0 POL on Polygon Amoy. Fund this address before deploying."
    );
  }

  // Deploy EvidenceRegistry
  const EvidenceRegistryFactory =
    await ethers.getContractFactory("EvidenceRegistry");

  const evidenceRegistry = await EvidenceRegistryFactory.deploy(
    deployer.address
  );

  await evidenceRegistry.waitForDeployment();

  const contractAddress = await evidenceRegistry.getAddress();

  console.log("EvidenceRegistry deployed successfully!");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Admin / Initial Registrar: ${deployer.address}\n`);

  // Load contract ABI
  const artifactPath = path.resolve(
    __dirname,
    "../artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json"
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Contract artifact not found: ${artifactPath}`);
  }

  const rawArtifact = JSON.parse(
    fs.readFileSync(artifactPath, "utf-8")
  );

  const exportPayload = {
    contractName: "EvidenceRegistry",
    address: contractAddress,
    network: "polygonAmoy",
    chainId: 80002,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    abi: rawArtifact.abi,
  };

  // Export to backend
  const backendArtifactDir = path.resolve(
    __dirname,
    "../backend/contract_artifacts"
  );

  fs.mkdirSync(backendArtifactDir, { recursive: true });

  fs.writeFileSync(
    path.join(backendArtifactDir, "EvidenceRegistry.json"),
    JSON.stringify(exportPayload, null, 2)
  );

  console.log(
    "Exported ABI & address to backend/contract_artifacts/EvidenceRegistry.json"
  );

  // Export to frontend
  const frontendArtifactDir = path.resolve(
    __dirname,
    "../frontend/src/contract_artifacts"
  );

  fs.mkdirSync(frontendArtifactDir, { recursive: true });

  fs.writeFileSync(
    path.join(frontendArtifactDir, "EvidenceRegistry.json"),
    JSON.stringify(exportPayload, null, 2)
  );

  console.log(
    "Exported ABI & address to frontend/src/contract_artifacts/EvidenceRegistry.json\n"
  );

  console.log("=================================================");
  console.log("Deployment complete!");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log("=================================================\n");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});