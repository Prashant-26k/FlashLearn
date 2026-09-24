import OpenAICompatibleProvider from './OpenAICompatibleProvider.js';

export default class OpenRouterProvider extends OpenAICompatibleProvider {
    constructor() {
        super({
            name: 'openrouter',
            apiKeyEnv: 'OPENROUTER_API_KEY',
            baseUrl: 'https://openrouter.ai/api/v1',
            model: process.env.OPENROUTER_MODEL || 'openrouter/free',
            priority: 30,
            contextTokens: 128000,
        });
    }
}
