require('dotenv').config();

module.exports = {
  ethereum: {
    rpcUrl: process.env.ETHEREUM_RPC_URL,
    contractAddress: process.env.ETHEREUM_CONTRACT_ADDRESS,
  },
  aptos: {
    network: process.env.APTOS_NETWORK || 'testnet',
    privateKey: process.env.APTOS_PRIVATE_KEY,
    poolAddress: process.env.APTOS_POOL_ADDRESS,
  },
  server: {
    port: process.env.PORT || 3001,
  },
};