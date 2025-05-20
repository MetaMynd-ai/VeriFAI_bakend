import { mainnetConfig } from '@hsuite/types';
import { registerAs } from "@nestjs/config";
import { customMainnetConfig } from './network/mainnet.config';

function getNetworkConfig() {
  return process.env.NETWORK == 'public' ? mainnetConfig : customMainnetConfig;
}

export default registerAs('mainnet', () => ({
  ...getNetworkConfig(),
  mongodbUrl: process.env.PROD_MONGO_DB,
  node: {
    accountId: process.env.PROD_NODE_ID,
    privateKey: process.env.PROD_NODE_PRIVATE_KEY,
    publicKey: process.env.PROD_NODE_PUBLIC_KEY
  },
  mirrorNode: {
    url: process.env.PROD_MIRROR_API_URL,
    grpc: process.env.PROD_MIRROR_GRPC_URL
  },
  tokenId: process.env.PROD_TOKEN_ID
}));
  