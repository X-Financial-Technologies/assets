// pdf_html_enhanced.js
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const dir = './x/';
const pdfFiles = fs.readdirSync(dir).filter(file => file.endsWith('.pdf'));

// Use Promise.all for parallel conversions
const tasks = pdfFiles.map(file => {
  const pdfPath = path.join(dir, file);
  const htmlPath = pdfPath.replace('.pdf', '.html');

  return new Promise((resolve, reject) => {
    try {
      const dataBuffer = fs.readFileSync(pdfPath);
      pdf(dataBuffer).then(({ text, info, metadata }) => {
        // Extract metadata (title, etc.)
        const pdfTitle = metadata?.title || 'Untitled';
        const pdfCreator = info?.Creator || '';
        const pdfProducer = info?.Producer || '';
        const pdfVersion = info?.PDFFormatVersion || '';

        // Template-based HTML output
        const html = `
<html>
<head>
  <meta charset="utf-8">
  <title>${pdfTitle}</title>
</head>
<body>
  <h1>${pdfTitle}</h1>
  <p>Creator: ${pdfCreator}</p>
  <p>Producer: ${pdfProducer}</p>
  <p>PDF Version: ${pdfVersion}</p>
  <hr>
  <pre>${text}</pre>
</body>
</html>
        `;

        fs.writeFileSync(htmlPath, html);
        console.log(`Converted ${file} to HTML`);
        resolve();
      }).catch(reject);
    } catch (err) {
      reject(err);
    }
  });
});

// Handle parallel completion
Promise.all(tasks)
  .then(() => console.log('All PDFs converted successfully.'))
  .catch(err => console.error('Error converting PDFs:', err));
