// redis.ts
import Redis from 'ioredis';

export const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
});

redis.on('ready', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

