export default () => ({
  modules: {
    ClusterModule: {
      enabled: false,
      workers: null
    },
    ApiKeyModule: {
      enabled: true
    },
    ThrottlerModule: {
      enabled: true,
      config: {
        ttl: 120,
        limit: 1000,
        // default || redis
        storage: 'redis',
        redis: {
          host: process.env.REDIS_URL,
          port: process.env.REDIS_PORT,
          password: process.env.REDIS_PASSWORD,
          ttl: 240
        }        
      }
    }
  }
});
