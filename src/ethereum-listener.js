const { ethers } = require('ethers');
const config = require('./config');

const CONTRACT_ABI = [
  "event Deposit(bytes32 indexed commitment, uint256 timestamp, uint256 depositIndex)",
  "function commitments(bytes32) view returns (bool)",
  "function getDepositCount() view returns (uint256)"
];

class EthereumListener {
  constructor(onDeposit) {
    this.provider = new ethers.JsonRpcProvider(config.ethereum.rpcUrl);
    this.contract = new ethers.Contract(
      config.ethereum.contractAddress,
      CONTRACT_ABI,
      this.provider
    );
    this.onDeposit = onDeposit;
  }

  async start() {
    console.log('🔍 Starting Ethereum listener...');
    console.log('📍 Contract:', config.ethereum.contractAddress);

    // Listen to new deposits
    this.contract.on('Deposit', async (commitment, timestamp, depositIndex, event) => {
      console.log('\n🆕 New deposit detected!');
      console.log('📋 Commitment:', commitment);
      console.log('⏰ Timestamp:', new Date(Number(timestamp) * 1000).toISOString());
      console.log('🔢 Index:', depositIndex.toString());
      
      await this.onDeposit({
        commitment,
        timestamp: timestamp.toString(),
        depositIndex: depositIndex.toString(),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber,
      });
    });

    // Get current deposit count
    const count = await this.contract.getDepositCount();
    console.log('📊 Current deposits:', count.toString());
    console.log('✅ Listener active!\n');
  }

  async getDeposit(index) {
    return await this.contract.getCommitment(index);
  }

  async hasCommitment(commitment) {
    return await this.contract.commitments(commitment);
  }
}

module.exports = EthereumListener;