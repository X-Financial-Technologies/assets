// pdf_html003.js
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const DIR = './x/';
const MAX_WORKERS = os.cpus().length;

// Worker process
if (!isMainThread) {
    const { pdfPath } = workerData;
    
    async function convertPDF() {
        try {
            const dataBuffer = await fs.readFile(pdfPath);
            const { text, info, metadata } = await pdf(dataBuffer);
            
            const htmlPath = pdfPath.replace('.pdf', '.html');
            const fileName = path.basename(pdfPath);
            const pdfTitle = metadata?.title || fileName;
            
            const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>${pdfTitle}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        pre { white-space: pre-wrap; }
    </style>
</head>
<body>
    <h1>${pdfTitle}</h1>
    <div>
        <p>Creator: ${info?.Creator || 'Unknown'}</p>
        <p>Producer: ${info?.Producer || 'Unknown'}</p>
        <p>Version: ${info?.PDFFormatVersion || 'Unknown'}</p>
    </div>
    <hr>
    <pre>${text}</pre>
</body>
</html>`;

            await fs.writeFile(htmlPath, html);
            parentPort.postMessage({ success: true, file: fileName });
        } catch (error) {
            parentPort.postMessage({ success: false, file: path.basename(pdfPath), error: error.message });
        }
    }

    convertPDF();
}

// Main process
else {
    async function main() {
        try {
            // Get PDF files
            const files = await fs.readdir(DIR);
            const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
            
            if (pdfFiles.length === 0) {
                console.log('No PDF files found');
                return;
            }

            console.log(`Found ${pdfFiles.length} PDF files`);
            
            // Process files with workers
            const results = await Promise.all(
                pdfFiles.map(file => {
                    return new Promise((resolve) => {
                        const worker = new Worker(__filename, {
                            workerData: { pdfPath: path.join(DIR, file) }
                        });

                        worker.on('message', (result) => {
                            console.log(`Converted: ${result.file}`);
                            resolve(result);
                        });

                        worker.on('error', (error) => {
                            console.error(`Worker error: ${error}`);
                            resolve({ success: false, file, error: error.message });
                        });
                    });
                })
            );

            // Report results
            const successful = results.filter(r => r.success).length;
            console.log(`\nCompleted: ${successful}/${pdfFiles.length} files converted`);
            
            const failures = results.filter(r => !r.success);
            if (failures.length > 0) {
                console.log('\nFailed conversions:');
                failures.forEach(f => console.error(`- ${f.file}: ${f.error}`));
            }

        } catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    }

    main();
}