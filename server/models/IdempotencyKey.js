import mongoose from 'mongoose';

const idempotencyKeySchema = new mongoose.Schema({
    key: { type: String, required: true },
    userId: { type: String, required: true },
    statusCode: { type: Number, required: true },
    responseBody: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 }, // 24h TTL
});

idempotencyKeySchema.index({ key: 1, userId: 1 }, { unique: true });

export default mongoose.model('IdempotencyKey', idempotencyKeySchema);
