import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
    deckIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Deck' }],
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
});

export default mongoose.model('QuizResult', quizResultSchema);
