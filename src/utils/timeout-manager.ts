// simple-timeout-manager.ts
import logger from "src/utils/logger";

interface TimeoutEntry {
    callback: () => void | Promise<void>;
    expiresAt: number;
    timeout: NodeJS.Timeout;
}

export class TimeoutManager {
    private timeouts = new Map<string, TimeoutEntry>();
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Clean up stale timeouts every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanupStaleTimeouts();
        }, 60000);

        logger.info('TimeoutManager initialized');
    }

    schedule(
        key: string,
        callback: () => void | Promise<void>,
        delayMs: number = 60000
    ): void {
        // Cancel existing if any
        this.cancel(key);

        const expiresAt = Date.now() + delayMs;

        // Schedule the timeout
        const timeout = setTimeout(async () => {
            const entry = this.timeouts.get(key);
            if (entry && entry.expiresAt === expiresAt) {
                try {
                    await callback();
                } catch (error) {
                    logger.error(`Timeout callback failed for ${key}:`, error);
                } finally {
                    this.timeouts.delete(key);
                    logger.info(`Deleted Key: ${key}`);
                }
            }
        }, delayMs);

        this.timeouts.set(key, {
            callback,
            expiresAt,
            timeout,
        });

        logger.debug(`Scheduled timeout for ${key} (${delayMs}ms)`);
    }

    cancel(key: string): boolean {
        const entry = this.timeouts.get(key);
        if (entry) {
            clearTimeout(entry.timeout);
            this.timeouts.delete(key);
            logger.info(`Cancelled timeout for ${key}`);
            return true;
        }
        return false;
    }

    private cleanupStaleTimeouts(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.timeouts) {
            if (entry.expiresAt < now) {
                clearTimeout(entry.timeout);
                this.timeouts.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug(`Cleaned up ${cleaned} stale timeouts`);
        }
    }

    getStats(): { active: number } {
        return { active: this.timeouts.size };
    }

    shutdown(): void {
        clearInterval(this.cleanupInterval);
        for (const [key, entry] of this.timeouts) {
            clearTimeout(entry.timeout);
        }
        this.timeouts.clear();
        logger.info('TimeoutManager shut down');
    }
}