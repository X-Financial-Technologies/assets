const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const dir = './x/';
fs.readdirSync(dir)
  .filter(file => file.endsWith('.pdf'))
  .forEach(file => {
    const pdfPath = path.join(dir, file);
    const htmlPath = pdfPath.replace('.pdf', '.html');

    const dataBuffer = fs.readFileSync(pdfPath);
    pdf(dataBuffer).then(({ text }) => {
      const html = `<html><body><pre>${text}</pre></body></html>`;
      fs.writeFileSync(htmlPath, html);
      console.log(`Converted ${file} to HTML`);
    });
  });