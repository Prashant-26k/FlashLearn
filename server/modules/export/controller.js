import { exportService } from './service.js';

export const exportController = {
    async exportDeck(req, res, next) {
        try {
            const { filename, content } = await exportService.exportDeckAsText(req.params.deckId, req.user.userId);
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(content);
        } catch (err) {
            next(err);
        }
    }
};
