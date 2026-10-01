import { ProviderError } from '../errors.js';

export default class OpenAICompatibleProvider {
    constructor({ name, apiKeyEnv, baseUrl, model, priority, contextTokens }) {
        this.name = name;
        this.apiKeyEnv = apiKeyEnv;
        this.baseUrl = baseUrl;
        this.model = model;
        this.priority = priority;
        this.capabilities = { json: true, maxContextTokens: contextTokens };
    }

    isEnabled() {
        return Boolean(process.env[this.apiKeyEnv]);
    }

    async generate(prompt, { timeoutMs }) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Authorization': `Bearer ${process.env[this.apiKeyEnv]}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    temperature: 0.2,
                    messages: [{ role: 'user', content: prompt }],
                    response_format: { type: 'json_object' },
                }),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                const retryAfter = Number.parseInt(response.headers.get('retry-after') || '0', 10);
                throw new ProviderError(body.error?.message || `${this.name} request failed`, {
                    status: response.status,
                    retryable: [408, 429, 500, 502, 503, 504].includes(response.status),
                    errorType: response.status === 429 ? 'RATE_LIMITED' : response.status >= 500 ? 'TEMPORARY_FAILURE' : 'PROVIDER_ERROR',
                    retryAfterMs: retryAfter * 1000,
                });
            }
            const choice = body.choices?.[0]?.message?.content;
            if (!choice) throw new ProviderError('Provider returned an empty response', { errorType: 'INVALID_RESPONSE' });
            return { text: choice, usage: body.usage };
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new ProviderError(`${this.name} request timed out`, { retryable: true, errorType: 'TIMEOUT' });
            }
            throw error;
        } finally {
            clearTimeout(timer);
        }
    }
}
