import { describe, it, expect } from 'vitest';
import {
    checkFileSignature,
    sanitizeFilename,
    validateUploadedFile,
    withParseTimeout,
} from '../../server/utils/fileValidator.js';
import { ValidationError } from '../../server/utils/errors.js';

describe('File Upload Security & Validation', () => {
    describe('File Signature (Magic Bytes)', () => {
        it('detects valid PDF magic bytes (%PDF)', () => {
            const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
            expect(checkFileSignature(pdfBuffer, '.pdf')).toBe(true);
        });

        it('rejects fake PDF that does not begin with %PDF', () => {
            const fakePdf = Buffer.from('NOT A REAL PDF FILE');
            expect(checkFileSignature(fakePdf, '.pdf')).toBe(false);
        });

        it('detects valid DOCX magic bytes (PK\\x03\\x04 zip header)', () => {
            const docxBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
            expect(checkFileSignature(docxBuffer, '.docx')).toBe(true);
        });

        it('detects valid plain text and rejects binary file disguised as .txt', () => {
            const validTxt = Buffer.from('Here is normal study text for flashcards.');
            expect(checkFileSignature(validTxt, '.txt')).toBe(true);

            const binaryFile = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x00, 0x01]); // ELF executable with null byte
            expect(checkFileSignature(binaryFile, '.txt')).toBe(false);
        });
    });

    describe('Filename Sanitization', () => {
        it('strips directory traversal patterns and null bytes', () => {
            const unsafe = '../../../../etc/passwd\0.pdf';
            const safe = sanitizeFilename(unsafe);
            expect(safe).not.toContain('..');
            expect(safe).not.toContain('\0');
        });
    });

    describe('File Validation', () => {
        it('throws ValidationError when file content does not match extension', () => {
            const spoofedFile = {
                originalname: 'report.pdf',
                size: 500,
                buffer: Buffer.from('malicious payload disguised as pdf'),
            };

            expect(() => validateUploadedFile(spoofedFile)).toThrow(ValidationError);
        });
    });

    describe('Parsing Timeout', () => {
        it('times out long-running parse operations to prevent DoS', async () => {
            const slowOperation = () => new Promise(resolve => setTimeout(resolve, 100));
            await expect(withParseTimeout(slowOperation, 20)).rejects.toThrow('File parsing timed out');
        });

        it('resolves normal operations before timeout', async () => {
            const fastOperation = async () => 'extracted text';
            const result = await withParseTimeout(fastOperation, 1000);
            expect(result).toBe('extracted text');
        });
    });
});
