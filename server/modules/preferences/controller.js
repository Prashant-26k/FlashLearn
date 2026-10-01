import { preferencesService } from './service.js';

export const preferencesController = {
    async getPreferences(req, res, next) {
        try {
            const result = await preferencesService.getPreferences(req.user.userId);
            res.json(result);
        } catch (err) {
            next(err);
        }
    },

    async updatePreferences(req, res, next) {
        try {
            const result = await preferencesService.updatePreferences(req.user.userId, req.body);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
};
