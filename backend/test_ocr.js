const Tesseract = require('tesseract.js');
const path = require('path');

async function testOCR() {
    const file = path.resolve('uploads/3b28b9162dd65f23b5f9770682a6983e');
    try {
        console.log('Running OCR on:', file);
        const { data: { text } } = await Tesseract.recognize(file, 'eng');
        console.log('--- OCR Result ---');
        console.log(text);
    } catch (err) {
        console.error('OCR Error:', err);
    }
}
testOCR();
