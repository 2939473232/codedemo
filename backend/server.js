import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGenerationJob, getGenerationJob, listGenerationJobs } from './generationJobs.js';
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
  name: '森林冒险',
  targetEngine: 'Godot',
  style: '32x32 像素奇幻',
  view: '俯视角',
  assetTypes: ['角色', '道具', '图标', '地图'],
  status: '原型'
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload, null, 2));
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return null;
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
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
    sendJson(response, 403, { error: '禁止访问该路径' });
    return;
  }

  try {
    await readFile(filePath);
    const contentType = mimeTypes[extname(filePath)] || 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': contentType });
    createReadStream(filePath).pipe(response);
  } catch {
    if (isSharedModule) {
      sendJson(response, 404, { error: '资源不存在' });
      return;
    }

    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    createReadStream(join(frontendDir, 'index.html')).pipe(response);
  }
}

const server = createServer(async (request, response) => {
  const requestedUrl = new URL(request.url || '/', `http://${request.headers.host}`);

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

  if (requestedUrl.pathname === '/api/generation/schema') {
    sendJson(response, 200, generationSchema);
    return;
  }

  if (requestedUrl.pathname === '/api/generation/jobs' && request.method === 'GET') {
    sendJson(response, 200, { jobs: listGenerationJobs() });
    return;
  }

  if (requestedUrl.pathname === '/api/generation/jobs' && request.method === 'POST') {
    try {
      const payload = await readJsonBody(request);
      const result = createGenerationJob(payload);
      sendJson(response, result.statusCode, result.payload);
    } catch {
      sendJson(response, 400, { error: '请求体必须是有效 JSON' });
    }
    return;
  }

  const jobMatch = requestedUrl.pathname.match(/^\/api\/generation\/jobs\/([^/]+)$/);
  if (jobMatch && request.method === 'GET') {
    const result = getGenerationJob(jobMatch[1]);
    sendJson(response, result.statusCode, result.payload);
    return;
  }

  await serveStatic(request, response);
});

server.listen(port, () => {
  console.log(`SpriteForge dev server running at http://localhost:${port}`);
});
