import express from 'express';
import mongoose from 'mongoose';
import metricsService from '../services/metricsService.js';

const router = express.Router();

// Section 28: Liveness probe
router.get('/health/live', (req, res) => {
    res.json({
        status: 'alive',
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});

// Section 28: Readiness probe
router.get('/health/ready', async (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (!isDbConnected && process.env.NODE_ENV === 'production') {
        return res.status(503).json({
            status: 'not_ready',
            database: 'disconnected',
            timestamp: new Date().toISOString(),
        });
    }

    const latency = await metricsService.getMongoLatency();
    res.json({
        status: 'ready',
        database: isDbConnected ? 'connected' : 'disabled_or_connecting',
        mongoLatencyMs: latency,
        timestamp: new Date().toISOString(),
    });
});

// Legacy / backward-compatible health check
router.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

// Observability metrics endpoint
router.get(['/api/v1/metrics', '/health/metrics'], async (req, res) => {
    const summary = await metricsService.getMetricsSummary();
    res.json(summary);
});

export default router;
