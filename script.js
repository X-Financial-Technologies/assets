// script.js
const pdfs = [
    'x/US11410235.pdf',
    'x/US20190034926A1.pdf',
    'x/US20150206106A1.pdf',
    'x/US20180374062A1.pdf',
    'x/US20190172059A1.pdf',
    'x/US20200167773A1.pdf',
    'x/US20230351339A1.pdf',
    'x/US20240242185A1.pdf',
    'x/qkd-research-prototype-project-5-1.pdf'
  ];
  
  let searchIndex = [];
  let isIndexReady = false;
  let currentSearch = '';
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
  const debouncedSearch = debounce(performSearch, 300);
  
  document.getElementById('searchInput').addEventListener('input', onSearch);
  
  function onSearch(e) {
    currentSearch = e.target.value.trim().toLowerCase();
    if (!isIndexReady && currentSearch) {
      initIndex();
    } else {
      debouncedSearch();
    }
  }
  
  async function initIndex() {
    showLoader(true, 'Building search index...');
    try {
      // Build all at once in parallel
      await buildIndex();
      isIndexReady = true;
      performSearch();
    } catch (err) {
      console.error('Index build error:', err);
      document.getElementById('results').innerHTML = 'Error loading patents. Please refresh.';
    }
    showLoader(false);
  }
  
  // Build the index in parallel to reduce total time
  async function buildIndex() {
    const promises = pdfs.map(filename => parsePdfFile(filename));
    searchIndex = await Promise.all(promises);
  }
  
  // Parse single PDF file
  async function parsePdfFile(filename) {
    const pdfUrl = `${baseUrl}/${filename}`;
    let text = await extractPDFText(pdfUrl);
    
    // If text is empty, attempt OCR fallback
    if (!text) {
      console.warn(`${filename} might have no embedded text. Trying OCR fallback...`);
      text = await attemptOCR(pdfUrl);
    }
  
    return {
      filename: filename.split('/').pop(),
      path: filename,
      text: text.toLowerCase()
    };
  }
  
  // Extract text using pdf.js
  async function extractPDFText(pdfUrl) {
    try {
      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      let allText = '';
      const totalPages = pdf.numPages;
  
      // Get textContent from each page
      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        allText += pageText + ' ';
      }
      return allText.replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.error(`Error extracting text from ${pdfUrl}: `, error);
      return '';
    }
  }
  
  // Optional: OCR fallback using Tesseract.js (heavy in-browser!)
  async function attemptOCR(pdfUrl) {
    try {
      // Render first page as image, then run Tesseract
      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      const firstPage = await pdf.getPage(1);
      const scale = 1.5;
      const viewport = firstPage.getViewport({ scale });
  
      // Create an offscreen canvas to render the page
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
  
      // Render the page
      await firstPage.render({
        canvasContext: context,
        viewport
      }).promise;
  
      // Run Tesseract OCR
      const { data } = await Tesseract.recognize(canvas, 'eng');
      return data.text || '';
    } catch (err) {
      console.error('OCR fallback failed:', err);
      return '';
    }
  }
  
  // Filter & display results
  function performSearch() {
    if (!currentSearch) {
      document.getElementById('results').innerHTML = '';
      return;
    }
  
    const results = searchIndex.filter(entry =>
      entry.text.includes(currentSearch) ||
      entry.filename.toLowerCase().includes(currentSearch)
    );
    displayResults(results);
  }
  
  // Show results with excerpts
  function displayResults(results) {
    if (!results.length) {
      document.getElementById('results').innerHTML =
        '<div class="no-results">No matching patents found</div>';
      return;
    }
  
    const html = results.map(result => `
      <div class="result-item">
        <a href="${result.path}" target="_blank">${result.filename}</a>
        <div class="excerpt">${getExcerpt(result.text, currentSearch)}</div>
      </div>
    `).join('');
  
    document.getElementById('results').innerHTML = html;
  }
  
  // Highlight partial text around match
  function getExcerpt(fullText, query) {
    const startIndex = fullText.indexOf(query);
    if (startIndex === -1) return '';
  
    const snippetStart = Math.max(0, startIndex - 40);
    const snippetEnd = Math.min(fullText.length, startIndex + query.length + 40);
    const snippet = fullText.slice(snippetStart, snippetEnd);
  
    return '...' + snippet.replace(new RegExp(query, 'gi'), match => `<strong>${match}</strong>`) + '...';
  }
  
  // Debounce utility
  function debounce(fn, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
  
  // Show/hide loader
  function showLoader(show, message = '') {
    const loader = document.getElementById('loader');
    loader.style.display = show ? 'block' : 'none';
    if (message) loader.innerText = message;
  }
  