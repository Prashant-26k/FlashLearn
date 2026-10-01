import express from 'express';
import { preferencesController } from './controller.js';
import validate from '../../middleware/validate.js';
import { patchPreferencesSchema } from './schema.js';

const router = express.Router();

router.get('/', preferencesController.getPreferences);
router.patch('/', validate({ body: patchPreferencesSchema }), preferencesController.updatePreferences);

export default router;
