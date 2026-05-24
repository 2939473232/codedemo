import { buildImagePrompt, buildNegativePrompt } from '../backend/promptBuilder.js';
import { createGenerationRequest } from '../shared/generationSchema.js';

const project = {
  name: '森林冒险',
  gameType: '俯视角 RPG',
  targetEngine: 'Godot',
  tileSize: '32x32',
  artStyle: '像素奇幻',
  cameraView: '俯视角',
  palette: ['#35d0ff', '#ff4d6d', '#ffd166']
};

const request = createGenerationRequest(project, {
  assetType: '地图',
  description: '可无缝拼接的森林草地地图',
  size: '32x32',
  count: '4',
  transparentBackground: true,
  paletteLock: true,
  outlineMode: '轻描边',
  colorMode: '项目调色板',
  intendedUse: '地图素材'
});

const prompt = buildImagePrompt(request);
const negativePrompt = buildNegativePrompt(request);

assert(prompt.includes('seamless 2D game map tile'), 'Expected map-specific prompt guidance');
assert(prompt.includes('pixel art fantasy game asset'), 'Expected art style guidance');
assert(prompt.includes('#35d0ff'), 'Expected palette guidance');
assert(negativePrompt.includes('character'), 'Expected map negative prompt to avoid characters');

console.log('Prompt builder tests passed.');

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}
