import User from '../../models/User.js';
import { NotFoundError } from '../../utils/errors.js';

export const preferencesService = {
    async getPreferences(userId) {
        const user = await User.findById(userId).select('learningStyle');
        if (!user) {
            throw new NotFoundError('User not found', 'USER_NOT_FOUND');
        }
        return {
            learningStyle: user.learningStyle || 'sequential',
        };
    },

    async updatePreferences(userId, { learningStyle }) {
        const user = await User.findByIdAndUpdate(
            userId,
            { learningStyle },
            { returnDocument: 'after', runValidators: true, select: 'learningStyle' },
        );
        if (!user) {
            throw new NotFoundError('User not found', 'USER_NOT_FOUND');
        }
        return {
            learningStyle: user.learningStyle,
        };
    }
};
