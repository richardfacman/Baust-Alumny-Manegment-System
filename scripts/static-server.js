const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', process.env.STATIC_ROOT || path.join('BAUST', 'BAUST'));
const host = process.env.STATIC_HOST || '127.0.0.1';
const port = Number(process.env.STATIC_PORT) || 8000;
const apiTargetHost = process.env.API_TARGET_HOST || '127.0.0.1';
const apiTargetPort = Number(process.env.API_TARGET_PORT) || 5000;

const types = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
}

function cacheControlFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (['.css', '.gif', '.ico', '.jpg', '.jpeg', '.js', '.png', '.svg', '.webp'].includes(extension)) {
    return 'public, max-age=86400';
  }
  return 'no-cache';
}

function proxyApi(req, res) {
  const proxyReq = http.request({
    hostname: apiTargetHost,
    port: apiTargetPort,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${apiTargetHost}:${apiTargetPort}`,
    },
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', () => {
    send(res, 502, 'Backend API is not running');
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${host}:${port}`);
  if (url.pathname.startsWith('/api/')) {
    proxyApi(req, res);
    return;
  }

  const requestedPath = decodeURIComponent(url.pathname).replace(/^\/site(?=\/|$)/, '') || '/';
  const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.replace(/^\/+/, '');
  const filePath = path.resolve(root, relativePath);

  if (!filePath.startsWith(root + path.sep) && filePath !== root) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError) {
      send(res, 404, 'Not found');
      return;
    }

    const finalPath = stats.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    fs.stat(finalPath, (finalStatError, finalStats) => {
      if (finalStatError || !finalStats.isFile()) {
        send(res, 404, 'Not found');
        return;
      }

      res.writeHead(200, {
        'Cache-Control': cacheControlFor(finalPath),
        'Content-Length': finalStats.size,
        'Content-Type': types[path.extname(finalPath).toLowerCase()] || 'application/octet-stream',
      });
      fs.createReadStream(finalPath).pipe(res);
    });
  });
});

server.listen(port, host, () => {
  console.log(`Static site running at http://${host}:${port}/`);
  console.log(`Site alias running at http://${host}:${port}/site/`);
  console.log(`Proxying /api/* to http://${apiTargetHost}:${apiTargetPort}/`);
  console.log(`Serving ${root}`);
});
