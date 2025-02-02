// pdf_html007.js
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const os = require('os');
const crypto = require('crypto');
const Tesseract = require('tesseract.js');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Configuration
const config = {
    inputDir: './x/',
    outputDir: `./output_${new Date().toISOString().replace(/[:.]/g, '-')}_${crypto.randomBytes(4).toString('hex')}/`,
    maxWorkers: os.cpus().length,
    enableOCR: true, // Set to false to disable OCR fallback
    ocrLanguage: 'eng'
};

// Helper function for text content extraction
async function extractPageText(pageData) {
    try {
        const textContent = await pageData.getTextContent({
            normalizeWhitespace: true,
            disableCombineTextItems: false,
            includeMarkedContent: true
        });

        const textItems = textContent.items.map(item => ({
            text: item.str,
            x: item.transform[4],
            y: item.transform[5],
            width: item.width,
            height: item.height,
            fontSize: Math.sqrt(item.transform[0] * item.transform[0] + item.transform[1] * item.transform[1])
        }));

        // Sort by position (top to bottom, left to right)
        textItems.sort((a, b) => {
            const yDiff = b.y - a.y;
            return Math.abs(yDiff) < 5 ? a.x - b.x : yDiff;
        });

        // Reconstruct text with layout preservation
        let lastY = null;
        let lastX = null;
        let currentLine = '';
        let resultText = '';

        for (const item of textItems) {
            if (lastY === null || Math.abs(item.y - lastY) > item.fontSize) {
                if (currentLine) {
                    resultText += currentLine.trim() + '\n';
                    if (Math.abs(item.y - lastY) > item.fontSize * 2) {
                        resultText += '\n'; // Extra line break for paragraphs
                    }
                }
                currentLine = item.text;
            } else if (lastX !== null && (item.x - lastX) > item.fontSize) {
                currentLine += ' ' + item.text;
            } else {
                currentLine += item.text;
            }
            
            lastY = item.y;
            lastX = item.x + item.width;
        }

        if (currentLine) {
            resultText += currentLine.trim() + '\n';
        }

        return resultText;
    } catch (error) {
        console.error('Text extraction error:', error);
        return '';
    }
}

// OCR fallback function
async function performOCR(pdfPath) {
    try {
        const worker = await Tesseract.createWorker();
        await worker.loadLanguage(config.ocrLanguage);
        await worker.initialize(config.ocrLanguage);
        const { data: { text } } = await worker.recognize(pdfPath);
        await worker.terminate();
        return text;
    } catch (error) {
        console.error('OCR failed:', error);
        return null;
    }
}

// Worker process
if (!isMainThread) {
    const { pdfPath, outputDir } = workerData;
    
    async function convertPDF() {
        try {
            const dataBuffer = await fs.readFile(pdfPath);
            const fileName = path.basename(pdfPath, '.pdf');

            const data = await pdf(dataBuffer, {
                pagerender: extractPageText,
                max: 0
            });

            // Process text content
            let allText = '';
            if (Array.isArray(data.text)) {
                allText = data.text.join('\n\n=== Page Break ===\n\n');
            } else if (typeof data.text === 'object' && data.text !== null) {
                allText = Object.values(data.text).join('\n\n=== Page Break ===\n\n');
            } else {
                allText = String(data.text || '');
            }

            // Try OCR if text extraction failed
            if (!allText.trim() && config.enableOCR) {
                console.log(`Regular text extraction failed for ${fileName}, attempting OCR...`);
                const ocrText = await performOCR(pdfPath);
                if (ocrText) {
                    allText = ocrText;
                }
            }

            // Write text file
            const txtPath = path.join(outputDir, `${fileName}.txt`);
            await fs.writeFile(txtPath, allText);

            // Create HTML file
            const htmlPath = path.join(outputDir, `${fileName}.html`);
            const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${fileName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            color: #000000;
            background: #ffffff;
        }
        .metadata {
            background: #ffffff;
            padding: 20px;
            margin-bottom: 30px;
            border: 1px solid #000000;
        }
        .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #000000;
        }
        pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            background: #ffffff;
            padding: 15px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            overflow-x: auto;
            border: 1px solid #000000;
        }
        .page-break {
            border-top: 1px solid #000000;
            margin: 20px 0;
            padding-top: 20px;
        }
        footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #000000;
            color: #000000;
            font-size: 0.9em;
        }
        h1 {
            font-size: 24px;
            margin: 0 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #000000;
        }
        strong {
            font-weight: bold;
        }
        p {
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="metadata">
        <h1>${fileName}</h1>
        <p><strong>Pages:</strong> ${data.numpages || 'Unknown'}</p>
        <p><strong>Creator:</strong> ${data.info?.Creator || 'Unknown'}</p>
        <p><strong>Producer:</strong> ${data.info?.Producer || 'Unknown'}</p>
        <p><strong>Version:</strong> ${data.info?.PDFFormatVersion || 'Unknown'}</p>
        <p><strong>Created:</strong> ${new Date().toLocaleString()}</p>
    </div>
    <div class="content">
        <pre>${allText}</pre>
    </div>
    <footer>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        ${config.enableOCR && !data.text?.trim() ? '<p>Text extracted using OCR</p>' : ''}
    </footer>
</body>
</html>`;

            await fs.writeFile(htmlPath, html);
            
            parentPort.postMessage({
                success: true,
                file: fileName,
                outputs: {
                    txt: path.relative(process.cwd(), txtPath),
                    html: path.relative(process.cwd(), htmlPath)
                }
            });
        } catch (error) {
            parentPort.postMessage({
                success: false,
                file: path.basename(pdfPath),
                error: String(error)
            });
        }
    }

    convertPDF();
}

// Main process
else {
    async function main() {
        try {
            await fs.mkdir(config.outputDir, { recursive: true });
            console.log(`Created output directory: ${config.outputDir}`);

            const files = await fs.readdir(config.inputDir);
            const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
            
            if (pdfFiles.length === 0) {
                console.log('No PDF files found');
                return;
            }

            console.log(`Found ${pdfFiles.length} PDF files to convert\n`);
            
            const results = await Promise.all(
                pdfFiles.map(file => {
                    return new Promise((resolve) => {
                        const worker = new Worker(__filename, {
                            workerData: {
                                pdfPath: path.join(config.inputDir, file),
                                outputDir: config.outputDir
                            }
                        });

                        worker.on('message', (result) => {
                            if (result.success) {
                                console.log(`\nConverted ${result.file}:`);
                                console.log(`  TXT: ${result.outputs.txt}`);
                                console.log(`  HTML: ${result.outputs.html}`);
                            }
                            resolve(result);
                        });

                        worker.on('error', (error) => {
                            console.error(`Worker error for ${file}:`, error);
                            resolve({ success: false, file, error: String(error) });
                        });
                    });
                })
            );

            const successful = results.filter(r => r.success).length;
            console.log(`\nConversion complete: ${successful}/${pdfFiles.length} files converted`);
            
            const failures = results.filter(r => !r.success);
            if (failures.length > 0) {
                console.log('\nFailed conversions:');
                failures.forEach(f => console.error(`- ${f.file}: ${f.error}`));
            }

        } catch (error) {
            console.error('Fatal error:', error);
            process.exit(1);
        }
    }

    main();
}