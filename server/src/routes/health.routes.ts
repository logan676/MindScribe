import { Router } from 'express';
import type { Request, Response } from 'express';
import { pool } from '../config/database.js';
import logger from '../config/logger.js';
import os from 'os';
import fs from 'fs/promises';

const router = Router();

/**
 * Basic health check - lightweight for load balancers
 */
router.get('/health', async (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Detailed health check with all system metrics
 */
router.get('/health/detailed', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {},
  };

  try {
    // Database health check
    const dbStart = Date.now();
    try {
      const result = await pool.query('SELECT NOW() as now');
      health.checks.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStart,
        timestamp: result.rows[0].now,
      };
    } catch (error) {
      health.status = 'degraded';
      health.checks.database = {
        status: 'unhealthy',
        error: (error as Error).message,
        responseTime: Date.now() - dbStart,
      };
    }

    // Memory check
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

    health.checks.memory = {
      status: memoryUsagePercent < 90 ? 'healthy' : 'warning',
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      systemMemoryUsage: `${memoryUsagePercent.toFixed(1)}%`,
    };

    // Disk space check (uploads directory)
    try {
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      const stats = await fs.stat(uploadDir);
      health.checks.disk = {
        status: 'healthy',
        uploadDir,
        exists: true,
      };
    } catch (error) {
      health.checks.disk = {
        status: 'warning',
        message: 'Upload directory not accessible',
      };
    }

    // CPU check
    const cpus = os.cpus();
    const cpuUsage = process.cpuUsage();
    health.checks.cpu = {
      status: 'healthy',
      cores: cpus.length,
      model: cpus[0].model,
      user: cpuUsage.user,
      system: cpuUsage.system,
    };

    // Environment check
    health.checks.environment = {
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      env: process.env.NODE_ENV || 'development',
    };

    // API keys check (don't expose actual keys)
    health.checks.apiKeys = {
      assemblyAI: !!process.env.ASSEMBLYAI_API_KEY ? 'configured' : 'missing',
      deepSeek: !!process.env.DEEPSEEK_API_KEY ? 'configured' : 'missing',
      jwtSecret: !!process.env.JWT_SECRET ? 'configured' : 'missing',
    };

    // Response time
    health.responseTime = Date.now() - startTime;

    res.json(health);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: (error as Error).message,
    });
  }
});

/**
 * Readiness check - returns 200 only if app is ready to serve traffic
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    // Check database connectivity
    await pool.query('SELECT 1');

    // Check required environment variables
    const required = [
      'ASSEMBLYAI_API_KEY',
      'DEEPSEEK_API_KEY',
      'JWT_SECRET',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      return res.status(503).json({
        ready: false,
        message: 'Missing required configuration',
        missing,
      });
    }

    res.json({
      ready: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      message: 'Service not ready',
      error: (error as Error).message,
    });
  }
});

/**
 * Liveness check - simple ping to verify process is running
 */
router.get('/health/live', (req: Request, res: Response) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    pid: process.pid,
    uptime: process.uptime(),
  });
});

export default router;
