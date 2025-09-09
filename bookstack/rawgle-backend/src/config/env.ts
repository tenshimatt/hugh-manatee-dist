import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1000).max(65535).default(8000),
  API_VERSION: z.string().default('v1'),

  // Database Configuration
  DATABASE_URL: z.string().url('Invalid database URL'),
  DB_HOST: z.string().min(1, 'Database host is required'),
  DB_PORT: z.coerce.number().min(1).max(65535).default(5432),
  DB_NAME: z.string().min(1, 'Database name is required'),
  DB_USER: z.string().min(1, 'Database user is required'),
  DB_PASSWORD: z.string().min(1, 'Database password is required'),
  DB_MAX_CONNECTIONS: z.coerce.number().min(1).max(100).default(10),
  DB_MIN_CONNECTIONS: z.coerce.number().min(1).max(10).default(2),

  // Redis Configuration
  REDIS_URL: z.string().url('Invalid Redis URL'),
  REDIS_HOST: z.string().min(1, 'Redis host is required'),
  REDIS_PORT: z.coerce.number().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().min(0).max(15).default(0),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Email Configuration
  EMAIL_SERVICE: z.string().default('sendgrid'),
  EMAIL_API_KEY: z.string().min(1, 'Email API key is required'),
  EMAIL_FROM: z.string().email('Invalid from email address'),
  EMAIL_FROM_NAME: z.string().default('RAWGLE'),

  // File Upload Configuration
  UPLOAD_MAX_SIZE: z.coerce.number().min(1024).default(5242880), // 5MB
  UPLOAD_ALLOWED_TYPES: z.string().default('image/jpeg,image/png,image/webp,application/pdf'),
  UPLOAD_DESTINATION: z.string().default('uploads'),

  // CORS Configuration
  FRONTEND_URL: z.string().url('Invalid frontend URL'),
  CORS_ORIGIN: z.string().url('Invalid CORS origin'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().min(1000).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().min(1).default(100),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().min(1000).default(60000), // 1 minute
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().min(1).default(5),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(15).default(12),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('logs/rawgle.log'),
  LOG_MAX_SIZE: z.string().default('20m'),
  LOG_MAX_FILES: z.string().default('14d'),

  // Health Check
  HEALTH_CHECK_TIMEOUT: z.coerce.number().min(1000).default(5000),

  // Anthropic Configuration
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-3-haiku-20240307'),
  ANTHROPIC_MAX_TOKENS: z.coerce.number().min(50).max(4000).default(1000),
  ANTHROPIC_TEMPERATURE: z.coerce.number().min(0).max(1).default(0.7),
});

// Validate environment variables
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment validation failed:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

// Export validated environment
export const config = env;

// Export database configuration
export const dbConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: env.DB_MAX_CONNECTIONS,
  min: env.DB_MIN_CONNECTIONS,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Export Redis configuration
export const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

// Export JWT configuration
export const jwtConfig = {
  secret: env.JWT_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
};

// Export email configuration
export const emailConfig = {
  service: env.EMAIL_SERVICE,
  apiKey: env.EMAIL_API_KEY,
  from: env.EMAIL_FROM,
  fromName: env.EMAIL_FROM_NAME,
};

// Export upload configuration
export const uploadConfig = {
  maxSize: env.UPLOAD_MAX_SIZE,
  allowedTypes: env.UPLOAD_ALLOWED_TYPES.split(','),
  destination: env.UPLOAD_DESTINATION,
};

// Export CORS configuration
export const corsConfig = {
  origin: env.CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Export rate limiting configuration
export const rateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
};

export const authRateLimitConfig = {
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
};

console.log('✅ Environment configuration loaded successfully');
console.log(`🚀 Server will run on port ${env.PORT} in ${env.NODE_ENV} mode`);