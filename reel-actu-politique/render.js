// Rend reel.html image par image (30 i/s) puis assemble avec ffmpeg.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const FPS = 30, DUR = 20, W = 1080, H = 1920;
const out = process.argv[2] || path.join(__dirname, 'output', 'video.mp4');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'reel.html'));
  await page.evaluate(() => document.fonts.ready);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0; f < FPS * DUR; f++) {
    await page.evaluate(t => window.renderAt(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('ok', out);
})();
