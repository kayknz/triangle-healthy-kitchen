const http = require('http');
const fs = require('fs');
const path = require('path');
const { initDatabase } = require('./backend/database');
const { handleApi, securityHeaders } = require('./backend/api');

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '0.0.0.0';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.apk': 'application/vnd.android.package-archive'
};
const privateTopLevel = new Set(['backend', 'data', '.git', '.agents', '.codex', 'work']);

function sendFile(res, resolved) {
  fs.readFile(resolved, (error, data) => {
    if (error) {
      res.writeHead(404, { ...securityHeaders(), 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const extension = path.extname(resolved).toLowerCase();
    const headers = {
      ...securityHeaders(),
      'Content-Type': mime[extension] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': 'no-store'
    };
    if (extension === '.apk') {
      headers['Content-Disposition'] = `attachment; filename="${path.basename(resolved)}"`;
      headers['X-Content-Type-Options'] = 'nosniff';
    }
    res.writeHead(200, headers);
    res.end(data);
  });
}

async function requestHandler(req, res) {
  let requestUrl;
  try {
    requestUrl = new URL(req.url || '/', `http://${req.headers.host || `${host}:${port}`}`);
  } catch {
    res.writeHead(400, securityHeaders());
    res.end('Bad request');
    return;
  }

  if (await handleApi(req, res, requestUrl)) return;

  let requested = '/';
  try { requested = decodeURIComponent(requestUrl.pathname || '/'); }
  catch { requested = '/'; }

  const relative = requested.replace(/^\/+/, '');
  const firstPart = relative.split(/[\\/]/)[0].toLowerCase();
  if (privateTopLevel.has(firstPart) || firstPart.startsWith('.')) {
    res.writeHead(404, securityHeaders());
    res.end('Not found');
    return;
  }

  const filePath = requested === '/' ? path.join(root, 'index.html') : path.join(root, relative);
  const resolved = path.resolve(filePath);
  if ((!resolved.startsWith(root + path.sep) && resolved !== root) || !fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
    res.writeHead(404, securityHeaders());
    res.end('Not found');
    return;
  }
  sendFile(res, resolved);
}

async function start() {
  await initDatabase();
  const server = http.createServer((req, res) => {
    requestHandler(req, res).catch(error => {
      console.error(error);
      if (!res.headersSent) res.writeHead(500, { ...securityHeaders(), 'Content-Type': 'text/plain; charset=utf-8' });
      if (!res.writableEnded) res.end('Server error');
    });
  });

  server.listen(port, host, () => {
    console.log('Triangle Healthy Kitchen application is running:');
    console.log(`http://127.0.0.1:${port}/`);
    console.log('Persistent API and database are connected.');
    if (host === '0.0.0.0') console.log('Network preview is enabled on this port. Use your computer IP address from the same Wi-Fi.');
  });

  server.on('error', error => {
    if (error.code === 'EADDRINUSE') console.log(`Application is already running at http://127.0.0.1:${port}/`);
    else console.error(error.message);
  });
}

start().catch(error => {
  console.error('Triangle Healthy Kitchen server could not start:', error);
  process.exitCode = 1;
});
