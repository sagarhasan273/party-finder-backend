import * as dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  url: string;
  dbName: string;
  options: {
    connectTimeoutMS: number;
    socketTimeoutMS: number;
    maxPoolSize: number;
  };
}

interface CONFIG {
  applicantSuspendedTime: number
}

export const dbConfig: DatabaseConfig = {
  url: process.env.DB_URL || '',
  dbName: process.env.DB_NAME || '',
  options: {
    connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '30000', 10),
    socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT_MS || '30000', 10),
    maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '100', 10),
  },
};

export const config: CONFIG = {
  applicantSuspendedTime: parseInt(process.env.APPLICANT_SUSPENDED_TIME || '', 10)
}
