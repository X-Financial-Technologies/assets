// tree.js
const fs = require('fs');
const path = require('path');

function shouldInclude(item, fullPath) {
    const isDirectory = fs.statSync(fullPath).isDirectory();
    
    if (isDirectory) {
        return item === 'x' || item.startsWith('output_');
    }
    
    const parentDir = path.basename(path.dirname(fullPath));
    if (parentDir === 'x' || parentDir.startsWith('output_')) {
        return item.endsWith('.html') || item.endsWith('.pdf') || item.endsWith('.txt');
    }

    return false;
}

function generateTree(startPath) {
    let html = '<div id="directoryTree" class="directory-tree">\n';
    
    function buildTree(currentPath, indent = 0) {
        const items = fs.readdirSync(currentPath);
        let tree = '';
        
        items.sort((a, b) => {
            const aIsDir = fs.statSync(path.join(currentPath, a)).isDirectory();
            const bIsDir = fs.statSync(path.join(currentPath, b)).isDirectory();
            if (aIsDir && !bIsDir) return -1;
            if (!aIsDir && bIsDir) return 1;
            return a.localeCompare(b);
        })
        .filter(item => shouldInclude(item, path.join(currentPath, item)))
        .forEach(item => {
            const fullPath = path.join(currentPath, item);
            const stats = fs.statSync(fullPath);
            const isDirectory = stats.isDirectory();
            const relPath = path.relative(startPath, fullPath);
            
            const indentStr = '  '.repeat(indent);
            const itemClass = isDirectory ? 'directory' : 'file';
            
            if (isDirectory) {
                tree += `${indentStr}<div class="${itemClass}">`;
                tree += `<span class="folder">[-] ${item}</span>\n`;
                tree += buildTree(fullPath, indent + 1);
                tree += `${indentStr}</div>\n`;
            } else {
                const displayName = item.replace(/\.[^/.]+$/, ""); // Remove file extension
                const fileType = path.extname(item).toUpperCase().substring(1);
                tree += `${indentStr}<div class="${itemClass}">|-- <a href="${relPath}" class="file-link">
                    <span class="file-name">${displayName}</span>
                    <span class="file-type">${fileType}</span></a></div>\n`;
            }
        });
        
        return tree;
    }
    
    html += buildTree(startPath);
    html += '</div>\n\n';
    
    html += `
<script>
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.folder').forEach(folder => {
        folder.addEventListener('click', function() {
            const parent = this.parentElement;
            const children = Array.from(parent.children).slice(1);
            const isExpanded = this.textContent.startsWith('[-]');
            
            this.textContent = this.textContent.replace(
                isExpanded ? '[-]' : '[+]',
                isExpanded ? '[+]' : '[-]'
            );
            
            children.forEach(child => {
                child.style.display = isExpanded ? 'none' : 'block';
            });
        });
    });
});
</script>`;

    return html;
}

const indexPath = path.join(__dirname, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

const tree = generateTree(__dirname);

const styles = `
<style>
.directory-tree {
    font-family: Arial, sans-serif;
    margin: 30px 0;
    padding: 25px;
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e1e4e8;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    font-size: 14px;
    line-height: 1.6;
}

.directory-tree div {
    padding: 4px 0;
}

.directory-tree .file {
    margin-left: 24px;
    color: #586069;
}

.directory-tree a {
    color: #0366d6;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 10px;
}

.directory-tree a:hover {
    text-decoration: underline;
}

.folder {
    cursor: pointer;
    color: #24292e;
    font-weight: 600;
    user-select: none;
}

.folder:hover {
    color: #0366d6;
}

.directory-tree .directory {
    margin-left: 20px;
}

.directory-tree .directory:first-child {
    margin-left: 0;
}

.file-type {
    font-size: 12px;
    color: #666;
    background: #f1f8ff;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 500;
}

.file-name {
    color: #24292e;
}

.directory-tree h3 {
    margin: 0 0 20px 0;
    color: #24292e;
    font-weight: 600;
    font-size: 16px;
    border-bottom: 1px solid #eaecef;
    padding-bottom: 10px;
}
</style>`;

const newContent = indexContent.replace(
    '<div id="results"></div>',
    '<div id="results"></div>\n<div class="directory-section">\n<h3>Project Files:</h3>\n' + styles + tree + '</div>'
);

fs.writeFileSync(indexPath, newContent);

console.log('Directory tree added to index.html');