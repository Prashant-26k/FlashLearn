import { ValidationError } from './errors.js';

const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt']);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;
const PARSE_TIMEOUT_MS = 15000; // 15 seconds

export function sanitizeFilename(filename) {
    if (!filename) return 'unnamed_document';
    // Remove null bytes, directory traversal patterns, and normalize
    return filename
        .replace(/\0/g, '')
        .replace(/(\.\.[/\\s])+/g, '')
        .replace(/[^a-zA-Z0-9._ -]/g, '_')
        .slice(0, 200);
}

export function checkFileSignature(buffer, extension) {
    if (!buffer || buffer.length === 0) return false;

    if (extension === '.pdf') {
        // PDF magic bytes: %PDF (0x25 0x50 0x44 0x46)
        if (buffer.length < 4) return false;
        return (
            buffer[0] === 0x25 &&
            buffer[1] === 0x50 &&
            buffer[2] === 0x44 &&
            buffer[3] === 0x46
        );
    }

    if (extension === '.docx') {
        // DOCX is a ZIP file: PK\x03\x04 (0x50 0x4B 0x03 0x04)
        if (buffer.length < 4) return false;
        return (
            buffer[0] === 0x50 &&
            buffer[1] === 0x4b &&
            buffer[2] === 0x03 &&
            buffer[3] === 0x04
        );
    }

    if (extension === '.txt') {
        // Plain text: should not contain null bytes (indicative of binary files)
        const checkLength = Math.min(buffer.length, 1024);
        for (let i = 0; i < checkLength; i++) {
            if (buffer[i] === 0x00) return false; // Binary null byte
        }
        return true;
    }

    return false;
}

export function validateUploadedFile(file) {
    if (!file || !file.buffer) {
        throw new ValidationError('Uploaded file is missing content');
    }

    if (file.size > MAX_FILE_SIZE || file.buffer.length > MAX_FILE_SIZE) {
        throw new ValidationError(`File "${file.originalname}" exceeds maximum allowed size of 10MB`);
    }

    const originalName = file.originalname || '';
    const lastDotIndex = originalName.lastIndexOf('.');
    if (lastDotIndex === -1) {
        throw new ValidationError(`File "${originalName}" is missing an extension`);
    }

    const ext = originalName.slice(lastDotIndex).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        throw new ValidationError(`File extension "${ext}" is not supported. Supported: .pdf, .docx, .txt`);
    }

    // Verify magic bytes
    if (!checkFileSignature(file.buffer, ext)) {
        throw new ValidationError(`File "${originalName}" contents do not match its declared extension ${ext}`);
    }

    file.sanitizedName = sanitizeFilename(originalName);
    return true;
}

export function validateUploadedFiles(files) {
    if (!files || files.length === 0) {
        throw new ValidationError('At least one file must be provided');
    }

    if (files.length > MAX_FILES) {
        throw new ValidationError(`Cannot upload more than ${MAX_FILES} files at once`);
    }

    for (const file of files) {
        validateUploadedFile(file);
    }
}

export async function withParseTimeout(fn, timeoutMs = PARSE_TIMEOUT_MS) {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error(`File parsing timed out after ${timeoutMs / 1000}s`));
        }, timeoutMs);
    });

    try {
        return await Promise.race([fn(), timeoutPromise]);
    } finally {
        clearTimeout(timer);
    }
}
