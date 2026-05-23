import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generationSchema } from '../shared/generationSchema.js';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const frontendDir = join(rootDir, 'frontend');
const sharedDir = join(rootDir, 'shared');
const port = Number(process.env.PORT || 5173);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml; charset=utf-8'
};

const demoProject = {
  id: 'forest-adventure',
  name: 'Forest Adventure',
  targetEngine: 'Godot',
  style: '32x32 Pixel Fantasy',
  view: 'Top-down',
  assetTypes: ['Character', 'Item', 'Icon', 'Tile'],
  status: 'Prototype'
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload, null, 2));
}

function isPathInside(basePath, targetPath) {
  const relativePath = relative(basePath, targetPath);
  return relativePath === '' || (!relativePath.startsWith('..') && !relativePath.includes(':'));
}

async function serveStatic(request, response) {
  const requestedUrl = new URL(request.url || '/', `http://${request.headers.host}`);
  const pathname = requestedUrl.pathname === '/' ? '/index.html' : requestedUrl.pathname;
  const isSharedModule = pathname.startsWith('/shared/');
  const staticDir = isSharedModule ? sharedDir : frontendDir;
  const staticPathname = isSharedModule ? pathname.replace('/shared/', '/') : pathname;
  const filePath = join(staticDir, decodeURIComponent(staticPathname));

  if (!isPathInside(staticDir, filePath)) {
    sendJson(response, 403, { error: 'Forbidden' });
    return;
  }

  try {
    await readFile(filePath);
    const contentType = mimeTypes[extname(filePath)] || 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': contentType });
    createReadStream(filePath).pipe(response);
  } catch {
    if (isSharedModule) {
      sendJson(response, 404, { error: 'Not found' });
      return;
    }

    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    createReadStream(join(frontendDir, 'index.html')).pipe(response);
  }
}

const server = createServer(async (request, response) => {
  if (request.url === '/api/health') {
    sendJson(response, 200, {
      ok: true,
      service: 'spriteforge',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (request.url === '/api/demo-project') {
    sendJson(response, 200, demoProject);
    return;
  }

  if (request.url === '/api/generation/schema') {
    sendJson(response, 200, generationSchema);
    return;
  }

  await serveStatic(request, response);
});

server.listen(port, () => {
  console.log(`SpriteForge dev server running at http://localhost:${port}`);
});
