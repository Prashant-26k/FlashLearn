import mongoose from 'mongoose';

class MetricsService {
    constructor() {
        this.httpRequestsTotal = 0;
        this.httpStatusCounts = {};
        this.httpDurations = [];
        this.aiRequestsTotal = 0;
        this.aiFailuresTotal = 0;
        this.aiDurations = [];
        this.quotaFailuresTotal = 0;
        this.maxSamples = 1000;
    }

    recordHttpRequest(status, durationMs) {
        this.httpRequestsTotal += 1;
        const bucket = `${Math.floor(status / 100)}xx`;
        this.httpStatusCounts[bucket] = (this.httpStatusCounts[bucket] || 0) + 1;
        this.httpDurations.push(durationMs);
        if (this.httpDurations.length > this.maxSamples) {
            this.httpDurations.shift();
        }
    }

    recordAiRequest(success, durationMs) {
        this.aiRequestsTotal += 1;
        if (!success) this.aiFailuresTotal += 1;
        this.aiDurations.push(durationMs);
        if (this.aiDurations.length > this.maxSamples) {
            this.aiDurations.shift();
        }
    }

    recordQuotaFailure() {
        this.quotaFailuresTotal += 1;
    }

    calculatePercentile(arr, p) {
        if (!arr.length) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    async getMongoLatency() {
        if (mongoose.connection.readyState !== 1) {
            return null;
        }
        const start = Date.now();
        try {
            await mongoose.connection.db.admin().ping();
            return Date.now() - start;
        } catch {
            return -1;
        }
    }

    async getMetricsSummary() {
        const mongoLatency = await this.getMongoLatency();
        const avgHttp = this.httpDurations.length
            ? Math.round(this.httpDurations.reduce((a, b) => a + b, 0) / this.httpDurations.length)
            : 0;
        const avgAi = this.aiDurations.length
            ? Math.round(this.aiDurations.reduce((a, b) => a + b, 0) / this.aiDurations.length)
            : 0;

        return {
            uptime: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
            memory: process.memoryUsage(),
            http: {
                totalRequests: this.httpRequestsTotal,
                statusCounts: this.httpStatusCounts,
                avgLatencyMs: avgHttp,
                p95LatencyMs: this.calculatePercentile(this.httpDurations, 95),
                p99LatencyMs: this.calculatePercentile(this.httpDurations, 99),
            },
            ai: {
                totalRequests: this.aiRequestsTotal,
                failedRequests: this.aiFailuresTotal,
                failureRatePercent: this.aiRequestsTotal ? ((this.aiFailuresTotal / this.aiRequestsTotal) * 100).toFixed(2) : 0,
                avgLatencyMs: avgAi,
                p95LatencyMs: this.calculatePercentile(this.aiDurations, 95),
            },
            quotaFailuresTotal: this.quotaFailuresTotal,
            database: {
                status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
                pingLatencyMs: mongoLatency,
            }
        };
    }
}

export const metricsService = new MetricsService();
export default metricsService;
