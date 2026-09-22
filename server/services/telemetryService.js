import AIRequest from '../models/AIRequest.js';

export async function recordAIRequest(data) {
    try {
        await AIRequest.create(data);
    } catch (error) {
        // Telemetry must not turn a successful generation into a user-visible failure.
        console.error('AI telemetry write failed:', error.message);
    }
}
