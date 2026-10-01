import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    dueAt: { type: Date, default: Date.now },
    intervalDays: { type: Number, default: 0 },
    repetitions: { type: Number, default: 0 },
    lapses: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 },
    lastReviewedAt: { type: Date, default: null },
}, { _id: false });

const deckSchema = new mongoose.Schema({
    title: { type: String, required: true },
    topic: { type: String, default: 'General' },
    cards: [cardSchema],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isFavorite: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

// Section 13 indexes
deckSchema.index({ userId: 1, createdAt: -1 });
deckSchema.index({ userId: 1, updatedAt: -1 });
deckSchema.index({ userId: 1, isFavorite: 1 });
deckSchema.index({ userId: 1, title: 1 });

export default mongoose.model('Deck', deckSchema);
