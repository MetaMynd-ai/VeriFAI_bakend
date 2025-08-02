import { localConfig, testnetConfig } from "@hsuite/types";
import { customTestnetConfig } from "./network/testnet.config";
import { customLocalConfig } from "./network/local.config";
import { registerAs } from "@nestjs/config";

function getNetworkConfig() {
  let networkConfig = null;

  switch(process.env.NETWORK) {
    case 'public':
      networkConfig = process.env.CLIENT_ENV == 'testnet' ? testnetConfig : localConfig;
      break;
    case 'private':
      networkConfig = process.env.CLIENT_ENV == 'testnet' ? customTestnetConfig : customLocalConfig;
      break;
  }

  return networkConfig;
}

export default registerAs('testnet', () => ({
  ...getNetworkConfig(),
  mongodbUrl: process.env.DEV_MONGO_DB,
  node: {
    accountId: process.env.DEV_NODE_ID,
    privateKey: process.env.DEV_NODE_PRIVATE_KEY,
    publicKey: process.env.DEV_NODE_PUBLIC_KEY
  },
  mirrorNode: {
    url: process.env.DEV_MIRROR_API_URL,
    grpc: process.env.DEV_MIRROR_GRPC_URL
  },
  tokenId: process.env.DEV_TOKEN_ID
}));
