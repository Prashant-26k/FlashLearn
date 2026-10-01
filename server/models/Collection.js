import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    deckIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Deck' }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
});

collectionSchema.index({ userId: 1, name: 1 });

export default mongoose.model('Collection', collectionSchema);
