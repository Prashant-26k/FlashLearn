import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    deckIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Deck' }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

export default mongoose.model('Collection', collectionSchema);
