document.addEventListener('DOMContentLoaded', () => {
const iframe = document.querySelector('iframe');
iframe.onerror = () => console.error('Error loading PDF');

document.addEventListener('keydown', e => {
    // Fullscreen toggle on 'f'
    if (e.key === 'f') {
    if (document.fullscreenElement) document.exitFullscreen();
    else iframe.requestFullscreen();
    }
    // Block Ctrl+P, Ctrl+S, Ctrl+U, Ctrl+A
    if (e.ctrlKey && ['p','s','u','a'].includes(e.key)) e.preventDefault();
});

// Disable right-click and drag
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('dragstart', e => e.preventDefault());
});
