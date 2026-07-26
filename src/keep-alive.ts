import http from 'http';
import logger from './utils/logger';

interface KeepAliveOptions {
    interval?: number; // in milliseconds
    activityInterval?: number; // in milliseconds
}

export const setupKeepAlive = (
    server: http.Server,
    options: KeepAliveOptions = {}
): void => {
    const {
        interval = 600000, // 10 minutes
        activityInterval = 300000, // 5 minutes
    } = options;

    const port: number = parseInt(process.env.PORT || '3000', 10);
    const baseUrl: string = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;

    logger.info('🔄 Keep-alive system initialized');

    // Ping every specified interval
    const pingInterval = setInterval(async () => {
        try {
            const response = await fetch(`${baseUrl}/health`);
            if (response.ok) {
                logger.info(`✅ Self-ping successful at ${new Date().toISOString()}`);
            } else {
                logger.warn(`⚠️ Self-ping returned status: ${response.status}`);
            }
        } catch (error) {
            logger.error(`❌ Self-ping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, interval);

    // Background activity
    const activityIntervalId = setInterval(() => {
        logger.debug(`🔄 Background keep-alive tick at ${new Date().toISOString()}`);
    }, activityInterval);

    // Clean up intervals on server close
    server.on('close', () => {
        clearInterval(pingInterval);
        clearInterval(activityIntervalId);
        logger.info('Keep-alive intervals cleared');
    });
};