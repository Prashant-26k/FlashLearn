import mongoose from 'mongoose';

const userUsageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    generationRequests: { type: Number, default: 0 },
    providerCalls: { type: Number, default: 0 },
    flashcardsGenerated: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

userUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('UserUsage', userUsageSchema);
