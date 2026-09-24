import OpenAICompatibleProvider from './OpenAICompatibleProvider.js';

export default class GroqProvider extends OpenAICompatibleProvider {
    constructor() {
        super({
            name: 'groq',
            apiKeyEnv: 'GROQ_API_KEY',
            baseUrl: 'https://api.groq.com/openai/v1',
            model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
            priority: 20,
            contextTokens: 128000,
        });
    }
}
