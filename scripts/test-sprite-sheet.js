import {
  createSpriteSheet,
  createSpriteSheetMetadata,
  createSpriteSheetSvg,
  getAnimatedAssets
} from '../frontend/src/spriteSheet.js';

const assets = [
  {
    id: 'asset_1',
    name: '骑士',
    type: '角色',
    fileName: 'knight_32x32.png',
    width: 32,
    height: 32,
    color: '#35d0ff',
    accent: '#ff4d6d'
  },
  {
    id: 'asset_2',
    name: '草地',
    type: '地块',
    fileName: 'grass_32x32.png',
    width: 32,
    height: 32
  }
];

const animatedAssets = getAnimatedAssets(assets);
const sheet = createSpriteSheet(animatedAssets[0]);
const metadata = createSpriteSheetMetadata(animatedAssets[0]);
const svg = createSpriteSheetSvg(animatedAssets[0]);

assert(animatedAssets.length === 1, 'Expected only character assets to animate');
assert(sheet.frames.length === 8, 'Expected idle and walk frames');
assert(sheet.width === 128 && sheet.height === 64, 'Expected horizontal spritesheet layout');
assert(sheet.frames[4].action === 'walk', 'Expected walk frames after idle frames');
assert(metadata.animations.idle.length === 4, 'Expected idle animation metadata');
assert(metadata.animations.walk.length === 4, 'Expected walk animation metadata');
assert(svg.includes('data-frame="walk_02"'), 'Expected SVG frame markers');

console.log('Sprite sheet tests passed.');

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}
