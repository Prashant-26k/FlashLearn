import { generationService } from './service.js';
import { ValidationError } from '../../utils/errors.js';

function extractFilesFromRequest(req) {
    const files = [];
    if (req.file) files.push(req.file);
    if (req.files) {
        if (Array.isArray(req.files)) {
            files.push(...req.files);
        } else {
            if (Array.isArray(req.files.files)) files.push(...req.files.files);
            if (Array.isArray(req.files.file)) files.push(...req.files.file);
            if (req.files.file && !Array.isArray(req.files.file)) files.push(req.files.file);
        }
    }
    return files;
}

export const generationController = {
    async generateFromText(req, res, next) {
        try {
            const result = await generationService.generateFromText(req.body.text, req.user.userId);
            res.json(result);
        } catch (err) {
            next(err);
        }
    },

    async generateFromTopic(req, res, next) {
        try {
            const result = await generationService.generateFromTopic(req.body.topic, req.user.userId);
            res.json(result);
        } catch (err) {
            next(err);
        }
    },

    async generateFromFile(req, res, next) {
        try {
            const files = extractFilesFromRequest(req);
            if (!files.length) {
                throw new ValidationError('At least one file is required');
            }
            const result = await generationService.generateFromFiles(files, req.user.userId);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
};
