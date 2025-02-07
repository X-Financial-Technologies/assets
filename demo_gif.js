const puppeteer = require('puppeteer');
const GIFEncoder = require('gifencoder');
const { createCanvas, Image } = require('canvas');
const fs = require('fs');

async function createDemoGif() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    await page.goto('file://' + __dirname + '/demo.html');

    const encoder = new GIFEncoder(800, 600);
    encoder.createReadStream().pipe(fs.createWriteStream('demo.gif'));
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(500);
    encoder.setQuality(10);

    // Capture frames
    for (let i = 0; i < 12; i++) {
        const screenshot = await page.screenshot();
        const image = new Image();
        image.src = screenshot;
        const canvas = createCanvas(800, 600);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        encoder.addFrame(ctx);
        await new Promise(r => setTimeout(r, 500));
    }

    encoder.finish();
    await browser.close();
}

createDemoGif().catch(console.error);