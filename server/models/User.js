import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    avatar: { type: String, default: '' },
    learningStyle: { type: String, enum: ['sequential', 'spaced'], default: 'sequential' },
    generationCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);
