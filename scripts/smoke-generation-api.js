import { createGenerationRequest } from '../shared/generationSchema.js';

const baseUrl = process.env.SPRITEFORGE_BASE_URL || 'http://127.0.0.1:5173';

const request = createGenerationRequest(
  {
    name: 'Forest Adventure',
    gameType: 'Top-down RPG',
    targetEngine: 'Godot',
    tileSize: '32x32',
    artStyle: 'Pixel Fantasy',
    cameraView: 'Top-down',
    palette: ['#35d0ff', '#ff4d6d', '#ffd166']
  },
  {
    assetType: 'Character',
    description: 'red scarf knight with a short sword',
    size: '32x32',
    count: '4',
    transparentBackground: true,
    paletteLock: true,
    outlineMode: 'Medium',
    colorMode: 'Project Palette',
    intendedUse: 'Player Character'
  }
);

const created = await postJson('/api/generation/jobs', request);
assert(created.id?.startsWith('job_'), 'Expected created job id');

const fetched = await getJson(`/api/generation/jobs/${created.id}`);
assert(fetched.id === created.id, 'Expected fetched job to match created job');

const list = await getJson('/api/generation/jobs');
assert(Array.isArray(list.jobs), 'Expected job list response');
assert(list.jobs.some((job) => job.id === created.id), 'Expected created job in list');

console.log(`Generation API smoke passed for ${created.id}.`);

async function postJson(path, payload) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
}

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  return parseResponse(response);
}

async function parseResponse(response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || `HTTP ${response.status}`);
  }
  return payload;
}

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}
