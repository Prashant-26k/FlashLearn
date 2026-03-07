/**
 * Chunks text into manageable sections for AI processing.
 * @param {string} text - The full extracted text.
 * @param {number} size - Recommended chunk size (2000-3000 characters).
 * @param {number} maxChunks - Maximum number of chunks to prevent excessive AI calls.
 * @returns {string[]} Array of text chunks.
 */
export function chunkText(text, size = 3000, maxChunks = 10) {
    if (!text) return [];

    const chunks = [];
    const normalizedText = text.replace(/\s+/g, ' ').trim();

    for (let i = 0; i < normalizedText.length; i += size) {
        if (chunks.length >= maxChunks) break;
        chunks.push(normalizedText.slice(i, i + size));
    }

    return chunks;
}
