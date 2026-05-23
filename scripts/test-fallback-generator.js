import { createFallbackManifest, generateFallbackAssets } from '../backend/fallbackGenerator.js';
import { createGenerationRequest } from '../shared/generationSchema.js';

const request = createGenerationRequest(
  {
    name: '森林冒险',
    gameType: '俯视角 RPG',
    targetEngine: 'Godot',
    tileSize: '32x32',
    artStyle: '像素奇幻',
    cameraView: '俯视角',
    palette: ['#35d0ff', '#ff4d6d', '#ffd166']
  },
  {
    assetType: '角色',
    description: '戴红色围巾的短剑骑士',
    size: '32x32',
    count: '4',
    transparentBackground: true,
    paletteLock: true,
    outlineMode: '中描边',
    colorMode: '项目调色板',
    intendedUse: '玩家角色'
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
assert(manifest.files[0].path.includes('/sprites/'), 'Expected typed export path');

console.log('Fallback generator tests passed.');

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}
