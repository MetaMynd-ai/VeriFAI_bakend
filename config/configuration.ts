import { identity } from "rxjs";

export default () => ({
  redis: {
    ttl: 120,
    socket: {
      host: process.env.REDIS_URL,
      port: Number(process.env.REDIS_PORT),
    },
    password: process.env.REDIS_PASSWORD
  },
  maxRatioImpactAllowed: 0.05,
  threshold: 51,
  port: parseInt(process.env.PORT, 10) || 3000,
  environment: process.env.NODE_ENV,
  client_environment: process.env.CLIENT_ENV,
  nftStorageToken: process.env.NFT_STORAGE_API_KEY,
  maxAutomaticTokenAssociations: process.env.MAX_AUTOMATIC_TOKEN_ASSOCIATIONS,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL
});
