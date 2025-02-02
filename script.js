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
      await buildIndex();
      isIndexReady = true;
      performSearch();
    } catch (err) {
      console.error('Index build error:', err);
      document.getElementById('results').innerHTML = 'Error loading patents. Please refresh.';
    }
    showLoader(false);
  }
  
  async function buildIndex() {
    const indexPromises = pdfs.map(async (filename) => {
      const pdfUrl = `${baseUrl}/${filename}`;
      const text = await extractPDFText(pdfUrl);
      return {
        filename: filename.split('/').pop(),
        path: filename,
        text: text.toLowerCase()
      };
    });
    searchIndex = await Promise.all(indexPromises);
  }
  
  async function extractPDFText(pdfUrl) {
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    let allText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      allText += content.items.map(item => item.str).join(' ') + ' ';
    }
    return allText.replace(/\s+/g, ' ').trim();
  }
  
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
  
  function displayResults(results) {
    const html = results.length > 0 
      ? results.map(result => `
          <div class="result-item">
            <a href="${result.path}" target="_blank">${result.filename}</a>
            <div class="excerpt">${getExcerpt(result.text, currentSearch)}</div>
          </div>
        `).join('')
      : '<div class="no-results">No matching patents found</div>';
  
    document.getElementById('results').innerHTML = html;
  }
  
  function getExcerpt(fullText, query) {
    const startIndex = fullText.indexOf(query);
    if (startIndex === -1) return '';
    
    const snippetStart = Math.max(0, startIndex - 40);
    const snippetEnd = Math.min(fullText.length, startIndex + query.length + 40);
    const snippet = fullText.slice(snippetStart, snippetEnd);
  
    return '...' + snippet.replace(new RegExp(query, 'gi'), match => `<strong>${match}</strong>`) + '...';
  }
  
  function debounce(fn, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
  
  function showLoader(show, message = '') {
    const loader = document.getElementById('loader');
    loader.style.display = show ? 'block' : 'none';
    if (message) loader.innerText = message;
  }