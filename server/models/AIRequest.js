import mongoose from 'mongoose';
import { aiConfig } from '../config/ai.js';

const aiRequestSchema = new mongoose.Schema({
    requestId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    provider: { type: String, required: true },
    model: { type: String, required: true },
    operation: { type: String, required: true },
    status: { type: String, enum: ['success', 'failure'], required: true },
    latencyMs: { type: Number, required: true },
    retryCount: { type: Number, default: 0 },
    fallbackCount: { type: Number, default: 0 },
    inputTokens: { type: Number, default: null },
    outputTokens: { type: Number, default: null },
    errorType: { type: String, default: null },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * aiConfig.telemetryRetentionDays },
}, { versionKey: false });

export default mongoose.model('AIRequest', aiRequestSchema);
