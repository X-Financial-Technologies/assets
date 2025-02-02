// pdf_html.js
const fs = require('fs').promises;
const path = require('path');
const { getDocument } = require('pdfjs-dist');

const CONCURRENCY_LIMIT = 4; // Adjust based on CPU cores

async function pdfToHtml(pdfBuffer) {
  try {
    const pdf = await getDocument(pdfBuffer).promise;
    const pageTextPromises = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      pageTextPromises.push(
        pdf.getPage(i)
          .then(page => page.getTextContent())
          .then(content => content.items.map(item => item.str).join(' '))
      );
    }

    const pageContents = await Promise.all(pageTextPromises);
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    .page { margin: 20px 0; }
  </style>
</head>
<body>
  ${pageContents.map(text => `<div class="page">${text}</div>`).join('\n')}
</body>
</html>`;
  } catch (error) {
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}

async function processPdfFile(pdfPath, htmlPath) {
  try {
    const pdfBuffer = await fs.readFile(pdfPath);
    const htmlContent = await pdfToHtml(pdfBuffer);
    await fs.writeFile(htmlPath, htmlContent);
    console.log(`Converted: ${path.basename(pdfPath)}`);
  } catch (error) {
    console.error(`Error processing ${path.basename(pdfPath)}: ${error.message}`);
  }
}

async function processInBatches(queue, batchSize) {
  for (let i = 0; i < queue.length; i += batchSize) {
    const batch = queue.slice(i, i + batchSize);
    await Promise.all(batch);
  }
}

async function main() {
  const dirPath = path.join(__dirname, 'x');
  const files = await fs.readdir(dirPath);
  const pdfFiles = files.filter(f => path.extname(f).toLowerCase() === '.pdf');

  const conversionQueue = pdfFiles.map(pdfFile => {
    const pdfPath = path.join(dirPath, pdfFile);
    const htmlFile = `${path.basename(pdfFile, '.pdf')}.html`;
    const htmlPath = path.join(dirPath, htmlFile);
    return processPdfFile(pdfPath, htmlPath);
  });

  await processInBatches(conversionQueue, CONCURRENCY_LIMIT);
  console.log('Conversion complete');
}

main().catch(console.error);