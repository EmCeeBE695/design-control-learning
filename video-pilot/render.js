// Renders scene.html frame by frame (30 fps, 1920x1080) and pipes them to ffmpeg -> MP4.
// Usage: node render.js out.mp4            (full clip)
//        node render.js stills t1 t2 ...   (PNG stills at those seconds, for checking)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const FPS = 30;
const ffmpeg = execSync('python3 -c "import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())"').toString().trim();

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'scene.html'));
  await page.evaluate(() => document.fonts.ready);
  const END = await page.evaluate(() => window.END);

  if (process.argv[2] === 'stills') {
    const dir = process.env.STILLS_DIR || '.';
    for (const t of process.argv.slice(3).map(Number)) {
      await page.evaluate(t => window.setT(t), t);
      await page.screenshot({ path: path.join(dir, `still_${t.toFixed(2)}.png`) });
    }
    await browser.close();
    return;
  }

  const out = process.argv[2] || 'nothing-broke-timeline-pilot.mp4';
  const ff = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r));
  const n = Math.round(END * FPS);
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => window.setT(t), i / FPS);
    const png = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await done;
  await browser.close();
  console.log('frames', n, '->', out);
})();
