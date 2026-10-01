import { PDFParse } from 'pdf-parse';

export default async function parsePdf(dataBuffer) {
    const parser = new PDFParse({ data: dataBuffer });
    try {
        const result = await parser.getText();
        return { text: result.text };
    } finally {
        await parser.destroy();
    }
}