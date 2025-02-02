// pdf_html004.js
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const os = require('os');

const config = {
    dir: './x/',
    encoding: 'utf-8'
};

async function processFile(filePath) {
    try {
        const dataBuffer = await fs.readFile(filePath);
        const pdfData = await pdf(dataBuffer, {
            pagerender: function(pageData) {
                return pageData.getTextContent({
                    normalizeWhitespace: true,
                    disableCombineTextItems: false
                });
            }
        });

        const { text, info, metadata } = pdfData;
        const fileName = path.basename(filePath, '.pdf');
        const htmlPath = path.join(path.dirname(filePath), fileName + '.html');

        // Create a clean and simple HTML file
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${fileName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        header {
            border-bottom: 1px solid #eee;
            margin-bottom: 20px;
            padding-bottom: 20px;
        }
        .content {
            background: white;
            padding: 20px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c5282;
            margin-top: 0;
        }
        .metadata {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
        }
        @media print {
            body {
                max-width: none;
                padding: 0;
            }
            .content {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <header>
        <h1>${fileName}</h1>
        <div class="metadata">
            <p><strong>Source:</strong> ${info?.Producer || 'Unknown'}</p>
            <p><strong>Pages:</strong> ${pdfData.numpages}</p>
            <p><strong>Created:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
    </header>
    <div class="content">
        ${text.replace(/\n/g, '<br>')}
    </div>
</body>
</html>`;

        await fs.writeFile(htmlPath, html);
        console.log(`Created: ${htmlPath}`);
        return { success: true, file: filePath };
    } catch (err) {
        console.error(`Error processing ${filePath}:`, err);
        return { success: false, file: filePath, error: err.message };
    }
}

async function main() {
    try {
        const files = await fs.readdir(config.dir);
        const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

        console.log(`Found ${pdfFiles.length} PDF files to convert`);

        const results = await Promise.all(
            pdfFiles.map(file => processFile(path.join(config.dir, file)))
        );

        const successful = results.filter(r => r.success).length;
        console.log(`\nConversion complete: ${successful}/${pdfFiles.length} files converted`);

        const failures = results.filter(r => !r.success);
        if (failures.length > 0) {
            console.log('\nFailed conversions:');
            failures.forEach(f => console.log(`- ${path.basename(f.file)}: ${f.error}`));
        }
    } catch (err) {
        console.error('Fatal error:', err);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}