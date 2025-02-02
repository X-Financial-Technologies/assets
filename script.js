const pdfs = [
    'US11410235.pdf',
    'US20190034926A1.pdf',
    'US20150206106A1.pdf',
    'US20180374062A1.pdf',
    'US20190172059A1.pdf',
    'US20200167773A1.pdf',
    'US20230351339A1.pdf',
    'US20240242185A1.pdf'
  ];
  
  let index = [];
  let isIndexBuilt = false;
  
  // Derive base URL
  const baseUrl = window.location.href.replace(/\/[^/]*$/, '/');
  
  document.getElementById('searchInput').addEventListener('input', async (e) => {
    const query = e.target.value.toLowerCase();
  
    // Build index on first search
    if (!isIndexBuilt && query) {
      document.getElementById('loader').style.display = 'block';
      await buildIndex();
      document.getElementById('loader').style.display = 'none';
      isIndexBuilt = true;
    }
  
    const matches = index.filter(entry => entry.text.toLowerCase().includes(query));
    document.getElementById('results').innerHTML = matches
      .map(m => `<a href="${m.filename}" target="_blank">${m.filename}</a>`)
      .join('<br>');
  });
  
  async function buildIndex() {
    for (const filename of pdfs) {
      const fileUrl = baseUrl + filename;
      const text = await extractText(fileUrl);
      index.push({ filename, text });
    }
  }
  
  async function extractText(pdfUrl) {
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ');
    }
    return text;
  }
  