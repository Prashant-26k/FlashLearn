import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
}, { _id: false });

const deckSchema = new mongoose.Schema({
    title: { type: String, required: true },
    topic: { type: String, default: 'General' },
    cards: [cardSchema],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Deck', deckSchema);
