import mongoose from 'mongoose';

const deckVisitSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deckId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deck', required: true },
    day: { type: Date, required: true },
    visitedAt: { type: Date, default: Date.now },
});

deckVisitSchema.index({ userId: 1, deckId: 1, day: 1 }, { unique: true });
deckVisitSchema.index({ userId: 1, day: 1 });
deckVisitSchema.index({ deckId: 1, day: 1 });

export default mongoose.model('DeckVisit', deckVisitSchema);
