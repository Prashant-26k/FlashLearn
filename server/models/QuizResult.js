import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
    deckIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Deck' }],
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, default: Date.now },
});

quizResultSchema.index({ userId: 1, date: -1 });

export default mongoose.model('QuizResult', quizResultSchema);
