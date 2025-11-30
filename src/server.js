const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const EthereumListener = require('./ethereum-listener');
const AptosSyncer = require('./aptos-syncer');
const WithdrawalHandler = require('./withdrawal-handler');
const config = require('./config');

// FIX: BigInt serialization
BigInt.prototype.toJSON = function() { return this.toString(); };

const app = express();
// app.use(cors());
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(bodyParser.json());

const aptosSyncer = new AptosSyncer();
const withdrawalHandler = new WithdrawalHandler(aptosSyncer);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get pool stats
app.get('/stats', async (req, res) => {
  const stats = await aptosSyncer.getStats();
  res.json(stats);
});

// Manual sync commitment (for testing)
app.post('/sync', async (req, res) => {
  const { commitment } = req.body;
  if (!commitment) {
    return res.status(400).json({ error: 'Commitment required' });
  }
  const result = await aptosSyncer.syncCommitment(commitment);
  res.json(result);
});

// Withdrawal request
app.post('/withdraw', async (req, res) => {
  const { secret, recipientAddress } = req.body;
  if (!secret || !recipientAddress) {
    return res.status(400).json({ error: 'Secret and recipientAddress required' });
  }
  
  try {
    const result = await withdrawalHandler.handleWithdrawal(secret, recipientAddress);
    
    // Convert transaction object to serializable format
    if (result.success && result.transaction) {
      const serializableResult = {
        success: true,
        message: result.message,
        transactionData: {
          sender: result.transaction.sender,
          // Don't send full transaction object
        }
      };
      return res.json(serializableResult);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check if commitment exists
app.get('/commitment/:commitment', async (req, res) => {
  const exists = await aptosSyncer.hasCommitment(req.params.commitment);
  res.json({ exists });
});

// Start server
app.listen(config.server.port, () => {
  console.log('\n🚀 COSMICAPT BRIDGE SERVER');
  console.log('================================');
  console.log(`📍 Server: http://localhost:${config.server.port}`);
  console.log(`🌐 Ethereum: ${config.ethereum.contractAddress}`);
  console.log(`🌐 Aptos: ${config.aptos.poolAddress}`);
  console.log('================================\n');
});

// Start Ethereum listener
const listener = new EthereumListener(async (deposit) => {
  console.log('🔄 Auto-syncing deposit to Aptos...');
  await aptosSyncer.syncCommitment(deposit.commitment);
});

listener.start().catch(console.error);