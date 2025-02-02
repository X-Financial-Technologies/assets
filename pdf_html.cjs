// Rename this file to pdf_html.cjs

const fs = require('fs').promises;
const path = require('path');
const { getDocument, GlobalWorkerOptions } = require('pdfjs-dist/legacy/build/pdf.js');

// Set the worker source path
GlobalWorkerOptions.workerSrc = path.join(
  __dirname,
  'node_modules',
  'pdfjs-dist',
  'legacy',
  'build',
  'pdf.worker.js'
);

async function pdfToHtml(pdfBuffer) {
  const pdfDoc = await getDocument({ data: pdfBuffer }).promise;
  const pages = await Promise.all(
    Array.from({ length: pdfDoc.numPages }, async (_, i) => {
      const page = await pdfDoc.getPage(i + 1);
      const content = await page.getTextContent();
      const text = content.items.map(item => item.str).join(' ');
      return `<div class="page">Page ${i + 1}: ${text}</div>`;
    })
  );
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PDF Conversion</title>
  <style>
    body { font-family: sans-serif; margin: 1em; }
    .page { margin: 1em 0; }
  </style>
</head>
<body>
${pages.join('\n')}
</body>
</html>
  `;
}

async function convertPdfToHtml(pdfFile) {
  const pdfPath = path.join(__dirname, 'x', pdfFile);
  const htmlPath = path.join(__dirname, 'x', pdfFile.replace(/\.pdf$/i, '.html'));
  const pdfBuffer = await fs.readFile(pdfPath);
  const htmlContent = await pdfToHtml(pdfBuffer);
  await fs.writeFile(htmlPath, htmlContent);
  console.log(`Converted ${pdfFile}`);
}

async function processAll() {
  const dirPath = path.join(__dirname, 'x');
  const files = await fs.readdir(dirPath);
  const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
  await Promise.all(pdfFiles.map(convertPdfToHtml));
  console.log('All conversions complete.');
}

processAll().catch(console.error);
