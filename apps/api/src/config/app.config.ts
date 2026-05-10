export default () => ({
  app: {
    port: Number(process.env.PORT ?? 3000),
    nodeEnv: process.env.NODE_ENV ?? "development"
  },
  auth: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET ?? "change-me",
    accessTokenTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET ?? "change-me-too",
    refreshTokenTtl: process.env.JWT_REFRESH_TTL ?? "7d"
  },
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "root",
    database: process.env.DB_NAME ?? "autoservice"
  }
});
