// const { ethers } = require('ethers');

// class WithdrawalHandler {
//   constructor(aptosSyncer) {
//     this.aptosSyncer = aptosSyncer;
//   }

//   async handleWithdrawal(secret, recipientAddress) {
//     console.log('\n🔍 Validating withdrawal request...');

//     // Calculate commitment from secret
//     const commitment = ethers.keccak256(secret);
//     console.log('📋 Calculated commitment:', commitment);

//     // Check if commitment exists on Aptos
//     const exists = await this.aptosSyncer.hasCommitment(commitment);
//     if (!exists) {
//       return {
//         success: false,
//         error: 'Commitment not found. Make sure deposit was synced.',
//       };
//     }

//     // Process withdrawal
//     const result = await this.aptosSyncer.processWithdrawal(secret, recipientAddress);
//     return result;
//   }
// }

// module.exports = WithdrawalHandler;

const { ethers } = require('ethers');

class WithdrawalHandler {
  constructor(aptosSyncer) {
    this.aptosSyncer = aptosSyncer;
  }

  async handleWithdrawal(secret, recipientAddress) {
    console.log('\n🔍 Validating withdrawal request...');
    console.log('Secret:', secret);

    // Calculate commitment from secret
    const commitment = ethers.keccak256(secret);
    console.log('📋 Calculated commitment:', commitment);

    // Check if commitment exists on Aptos
    const exists = await this.aptosSyncer.hasCommitment(commitment);
    console.log('Commitment exists:', exists);
    
    if (!exists) {
      return {
        success: false,
        error: 'Commitment not found. Make sure deposit was synced.',
      };
    }

    // FIX: Send COMMITMENT (not secret) to Aptos for withdrawal
    const result = await this.aptosSyncer.processWithdrawal(commitment, recipientAddress);
    return result;
  }
}

module.exports = WithdrawalHandler;