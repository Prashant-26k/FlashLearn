import mongoose from 'mongoose';

const globalUsageSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true },
    generationRequests: { type: Number, default: 0 },
    providerCalls: { type: Number, default: 0 },
    flashcardsGenerated: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

export default mongoose.model('GlobalUsage', globalUsageSchema);
