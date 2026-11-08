const fs = require('fs');

async function main() {
  const base = 'https://flexer.mrteches.com';
  console.log('Fetching', base);
  const res = await fetch(base + '/');
  const liveHtml = await res.text();
  fs.writeFileSync('tools/live_index.html', liveHtml);
  console.log('Saved live_index.html, length:', liveHtml.length);

  const cssRes = await fetch(base + '/style.css?v=3.0');
  const liveCss = await cssRes.text();
  fs.writeFileSync('tools/live_style.css', liveCss);
  console.log('Saved live_style.css, length:', liveCss.length);

  const scriptMatches = [...liveHtml.matchAll(/<script[^>]*src=["']([^"']+)["']/gi)].map(m => m[1]);
  console.log('Script matches:', scriptMatches);
  for (const s of scriptMatches) {
    const url = s.startsWith('http') ? s : base + (s.startsWith('/') ? '' : '/') + s;
    const r = await fetch(url);
    const content = await r.text();
    const filename = s.split('/').pop().split('?')[0];
    fs.writeFileSync('tools/live_' + filename, content);
    console.log('Saved tools/live_' + filename, 'length:', content.length);
  }
}

main().catch(console.error);
