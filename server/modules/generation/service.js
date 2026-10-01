import pdfParse from '../../utils/pdfParser.js';
import mammoth from 'mammoth';
import { generateCardsFromText, generateCardsFromTopic } from '../../services/gemini.js';
import { generateCardsFromChunks as orchestrateChunks } from '../../services/ai/orchestrator.js';
import { chunkText } from '../../utils/chunker.js';
import { aiConfig } from '../../config/ai.js';
import { reserveGeneration, releaseGeneration } from '../../services/usageService.js';
import { validateUploadedFiles, withParseTimeout } from '../../utils/fileValidator.js';
import { ValidationError } from '../../utils/errors.js';

async function extractTextFromFile(file) {
    const originalName = (file.originalname || '').toLowerCase();
    const mime = file.mimetype || '';

    if (mime === 'application/pdf' || originalName.endsWith('.pdf')) {
        return withParseTimeout(async () => {
            const data = await pdfParse(file.buffer);
            return data.text || '';
        }, 15000);
    }

    if (
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        originalName.endsWith('.docx')
    ) {
        return withParseTimeout(async () => {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            return result.value || '';
        }, 15000);
    }

    if (mime === 'text/plain' || originalName.endsWith('.txt') || mime.startsWith('text/')) {
        return file.buffer.toString('utf-8');
    }

    throw new ValidationError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
}

export const generationService = {
    async generateFromText(text, userId) {
        await reserveGeneration(userId);
        try {
            const cards = await generateCardsFromText(text, userId);
            return { cards };
        } catch (err) {
            await releaseGeneration(userId);
            throw err;
        }
    },

    async generateFromTopic(topic, userId) {
        await reserveGeneration(userId);
        try {
            const cards = await generateCardsFromTopic(topic, userId);
            return { cards };
        } catch (err) {
            await releaseGeneration(userId);
            throw err;
        }
    },

    async generateFromFiles(files, userId) {
        validateUploadedFiles(files);

        const extractedSections = [];
        for (const file of files) {
            try {
                const text = await extractTextFromFile(file);
                if (text && text.trim()) {
                    extractedSections.push(`Document: ${file.sanitizedName || file.originalname}\n\n${text}`);
                }
            } finally {
                // Section 32: Privacy & resource cleanup: erase buffer references
                file.buffer = null;
            }
        }

        const combinedText = extractedSections.join('\n\n---\n\n');
        if (!combinedText || !combinedText.trim()) {
            throw new ValidationError('Could not extract text from the uploaded file(s) or the file(s) are empty');
        }

        await reserveGeneration(userId);
        try {
            let cards = [];
            let warnings = [];

            if (combinedText.length > 3500) {
                const chunks = chunkText(combinedText, 3000, aiConfig.maxChunksPerGeneration);
                const result = await orchestrateChunks(chunks, {
                    userId,
                    maxCards: aiConfig.maxFlashcardsPerGeneration,
                });
                cards = result.cards;
                warnings = result.warnings;
            } else {
                cards = await generateCardsFromText(combinedText, userId);
            }

            return {
                cards,
                warnings,
                fileCount: files.length,
            };
        } catch (err) {
            await releaseGeneration(userId);
            throw err;
        }
    }
};
