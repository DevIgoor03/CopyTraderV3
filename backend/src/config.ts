import 'dotenv/config';

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Environment variable ${key} is required`);
  return val;
}

export const config = {
  server: {
    port:        parseInt(process.env.PORT ?? '3001', 10),
    nodeEnv:     process.env.NODE_ENV ?? 'development',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    isDev:       (process.env.NODE_ENV ?? 'development') === 'development',
  },
  db: {
    url: process.env.DATABASE_URL ?? 'postgresql://copytrader:copytrader123@localhost:5432/copytrader',
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://:redis123@localhost:6379',
  },
  jwt: {
    secret:         process.env.JWT_SECRET         ?? 'dev-jwt-secret-change-in-production',
    refreshSecret:  process.env.JWT_REFRESH_SECRET  ?? 'dev-refresh-secret-change-in-production',
    expiresIn:      process.env.JWT_EXPIRES_IN      ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY ?? 'dev-encryption-key-change-in-production',
  },
  bullex: {
    apiUrl:     process.env.BULLEX_API_URL     ?? 'https://api.trade.bull-ex.com',
    wsUrl:      process.env.BULLEX_WS_URL      ?? 'wss://ws.trade.bull-ex.com/echo/websocket',
    platformId: parseInt(process.env.BULLEX_PLATFORM_ID ?? '580', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
    max:      parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
    authMax:  parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? '10', 10),
  },
} as const;
