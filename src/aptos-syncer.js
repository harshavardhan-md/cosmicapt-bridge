const { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } = require('@aptos-labs/ts-sdk');
const config = require('./config');

class AptosSyncer {
  constructor() {
    const aptosConfig = new AptosConfig({ 
      network: config.aptos.network === 'testnet' ? Network.TESTNET : Network.MAINNET 
    });
    this.aptos = new Aptos(aptosConfig);
    
    // Remove '0x' prefix if present
    const privateKeyHex = config.aptos.privateKey.replace('0x', '');
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    this.account = Account.fromPrivateKey({ privateKey });
    
    console.log('🔑 Bridge account:', this.account.accountAddress.toString());
  }

  async syncCommitment(commitment) {
    console.log('\n📤 Syncing commitment to Aptos...');
    console.log('📋 Commitment:', commitment);

    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: {
          function: `${config.aptos.poolAddress}::cosmic_pool::sync_commitment`,
          functionArguments: [
            config.aptos.poolAddress,
            Array.from(Buffer.from(commitment.replace('0x', ''), 'hex'))
          ],
        },
      });

      const committedTxn = await this.aptos.signAndSubmitTransaction({
        signer: this.account,
        transaction,
      });

      const executedTransaction = await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      console.log('✅ Synced! Tx:', committedTxn.hash);
      return { success: true, txHash: committedTxn.hash };
    } catch (error) {
      console.error('❌ Sync failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async hasCommitment(commitment) {
    try {
      const result = await this.aptos.view({
        payload: {
          function: `${config.aptos.poolAddress}::cosmic_pool::has_commitment`,
          functionArguments: [
            config.aptos.poolAddress,
            Array.from(Buffer.from(commitment.replace('0x', ''), 'hex'))
          ],
        },
      });
      return result[0];
    } catch (error) {
      console.error('Error checking commitment:', error.message);
      return false;
    }
  }

  // async processWithdrawal(secret, recipientAddress) {
  //   console.log('\n💰 Processing withdrawal...');
  //   console.log('🔐 Secret:', secret);
  //   console.log('👤 Recipient:', recipientAddress);

  //   try {
  //     // Create transaction from user's account
  //     const transaction = await this.aptos.transaction.build.simple({
  //       sender: recipientAddress,
  //       data: {
  //         function: `${config.aptos.poolAddress}::cosmic_pool::withdraw`,
  //         functionArguments: [
  //           config.aptos.poolAddress,
  //           Array.from(Buffer.from(secret.replace('0x', ''), 'hex'))
  //         ],
  //       },
  //     });

  //     // Return unsigned transaction for user to sign
  //     return { 
  //       success: true, 
  //       transaction,
  //       message: 'Transaction built. User needs to sign with their wallet.'
  //     };
  //   } catch (error) {
  //     console.error('❌ Withdrawal failed:', error.message);
  //     return { success: false, error: error.message };
  //   }
  // }

//   async processWithdrawal(commitment, recipientAddress) {
//   console.log('\n💰 Processing withdrawal...');
//   console.log('🔐 Commitment:', commitment);
//   console.log('👤 Recipient:', recipientAddress);

//   try {
//     // FIX: Use commitment (not secret) because Move contract expects it
//     const transaction = await this.aptos.transaction.build.simple({
//       sender: recipientAddress,
//       data: {
//         function: `${config.aptos.poolAddress}::cosmic_pool::withdraw`,
//         functionArguments: [
//           config.aptos.poolAddress,
//           Array.from(Buffer.from(commitment.replace('0x', ''), 'hex'))
//         ],
//       },
//     });

//     return { 
//       success: true, 
//       transaction,
//       message: 'Transaction built. User needs to sign with their wallet.'
//     };
//   } catch (error) {
//     console.error('❌ Withdrawal failed:', error.message);
//     return { success: false, error: error.message };
//   }
// }


// async processWithdrawal(commitment, recipientAddress) {
//   console.log('\n💰 Processing withdrawal...');
//   console.log('🔐 Commitment:', commitment);
//   console.log('👤 Recipient:', recipientAddress);

//   try {
//     // Step 1: Mark as withdrawn in contract
//     const markTx = await this.aptos.transaction.build.simple({
//       sender: this.account.accountAddress,
//       data: {
//         function: `${config.aptos.poolAddress}::cosmic_pool::mark_withdrawn`,
//         functionArguments: [
//           config.aptos.poolAddress,
//           Array.from(Buffer.from(commitment.replace('0x', ''), 'hex'))
//         ],
//       },
//     });

//     const committedTxn = await this.aptos.signAndSubmitTransaction({
//       signer: this.account,
//       transaction: markTx,
//     });

//     await this.aptos.waitForTransaction({ transactionHash: committedTxn.hash });
//     console.log('✅ Marked as withdrawn! Tx:', committedTxn.hash);

//     // Step 2: Send APT from bridge to user
//     const sendTx = await this.aptos.transaction.build.simple({
//       sender: this.account.accountAddress,
//       data: {
//         function: '0x1::aptos_account::transfer',
//         functionArguments: [recipientAddress, 10000], // 0.00001 APT
//       },
//     });

//     const sendCommittedTxn = await this.aptos.signAndSubmitTransaction({
//       signer: this.account,
//       transaction: sendTx,
//     });

//     await this.aptos.waitForTransaction({ transactionHash: sendCommittedTxn.hash });
//     console.log('✅ APT sent! Tx:', sendCommittedTxn.hash);
//     console.log('🔗 https://explorer.aptoslabs.com/txn/' + sendCommittedTxn.hash + '?network=testnet');

//     return { 
//       success: true, 
//       txHash: sendCommittedTxn.hash,
//       message: 'Withdrawal successful! 0.00001 APT sent.'
//     };
//   } catch (error) {
//     console.error('❌ Withdrawal failed:', error.message);
//     return { success: false, error: error.message };
//   }
// }


async processWithdrawal(commitment, recipientAddress) {
  console.log('\n💰 Processing withdrawal...');
  console.log('🔐 Commitment:', commitment);
  console.log('👤 Recipient:', recipientAddress);

  try {
    // Step 1: Mark as withdrawn using withdraw function
    const markTx = await this.aptos.transaction.build.simple({
      sender: this.account.accountAddress,
      data: {
        function: `${config.aptos.poolAddress}::cosmic_pool::withdraw`,
        functionArguments: [
          config.aptos.poolAddress,
          Array.from(Buffer.from(commitment.replace('0x', ''), 'hex'))
        ],
      },
    });

    const committedTxn = await this.aptos.signAndSubmitTransaction({
      signer: this.account,
      transaction: markTx,
    });

    await this.aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    console.log('✅ Marked as withdrawn! Tx:', committedTxn.hash);

    // Step 2: Send APT from bridge to user
    const sendTx = await this.aptos.transaction.build.simple({
      sender: this.account.accountAddress,
      data: {
        function: '0x1::aptos_account::transfer',
        functionArguments: [recipientAddress, 10000],
      },
    });

    const sendCommittedTxn = await this.aptos.signAndSubmitTransaction({
      signer: this.account,
      transaction: sendTx,
    });

    await this.aptos.waitForTransaction({ transactionHash: sendCommittedTxn.hash });
    console.log('✅ APT sent! Tx:', sendCommittedTxn.hash);
    console.log('🔗 https://explorer.aptoslabs.com/txn/' + sendCommittedTxn.hash + '?network=testnet');

    return { 
      success: true, 
      txHash: sendCommittedTxn.hash,
      message: 'Withdrawal successful! 0.00001 APT sent.'
    };
  } catch (error) {
    console.error('❌ Withdrawal failed:', error.message);
    return { success: false, error: error.message };
  }
}

  async getStats() {
    try {
      const result = await this.aptos.view({
        payload: {
          function: `${config.aptos.poolAddress}::cosmic_pool::get_stats`,
          functionArguments: [config.aptos.poolAddress],
        },
      });
      return {
        totalDeposits: result[0],
        totalWithdrawals: result[1],
      };
    } catch (error) {
      console.error('Error getting stats:', error.message);
      return null;
    }
  }
}

module.exports = AptosSyncer;