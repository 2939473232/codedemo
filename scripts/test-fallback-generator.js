import { createFallbackManifest, generateFallbackAssets } from '../backend/fallbackGenerator.js';
import { createGenerationRequest } from '../shared/generationSchema.js';

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

const firstRun = generateFallbackAssets(request);
const secondRun = generateFallbackAssets(request);
const manifest = createFallbackManifest(request, firstRun);

assert(firstRun.length === 4, 'Expected 4 fallback assets');
assert(firstRun[0].id === secondRun[0].id, 'Expected stable asset ids');
assert(firstRun[0].fileName.endsWith('_32x32.png'), 'Expected size in file name');
assert(firstRun[0].metadata.fallback === true, 'Expected fallback metadata flag');
assert(manifest.files.length === firstRun.length, 'Expected manifest files to match assets');
assert(manifest.files[0].path.includes('/character/'), 'Expected typed export path');

console.log('Fallback generator tests passed.');

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}
