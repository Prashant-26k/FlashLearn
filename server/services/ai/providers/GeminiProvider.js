/* global process */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProviderError } from '../errors.js';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
let client;

export default class GeminiProvider {
    name = 'gemini';
    priority = 10;
    model = MODEL;
    capabilities = { json: true, maxContextTokens: 1000000 };

    isEnabled() {
        return Boolean(process.env.GEMINI_API_KEY);
    }

    async generate(prompt) {
        try {
            client ||= new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = client.getGenerativeModel({
                model: this.model,
                generationConfig: { responseMimeType: 'application/json' },
            });
            const result = await model.generateContent(prompt);
            return {
                text: result.response.text(),
                usage: result.response.usageMetadata,
            };
        } catch (error) {
            const status = error.status || Number(error.response?.status)
                || Number(error.message?.match(/\b(400|401|403|404|408|429|500|502|503|504)\b/)?.[1]);
            throw new ProviderError(error.message || 'Gemini request failed', {
                status,
                retryable: !status || [408, 429, 500, 502, 503, 504].includes(status),
                errorType: status === 429 ? 'RATE_LIMITED' : 'PROVIDER_ERROR',
            });
        }
    }
}
