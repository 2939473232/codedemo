import { createExportFileName, createExportManifest } from '../frontend/src/exportManifest.js';

const project = {
  name: '森林冒险',
  gameType: '俯视角 RPG',
  targetEngine: 'Godot',
  tileSize: '32x32',
  artStyle: '像素奇幻',
  cameraView: '俯视角',
  palette: ['#35d0ff', '#ff4d6d']
};

const assets = [
  {
    id: 'asset_1',
    name: '骑士',
    type: '角色',
    fileName: 'knight_32x32.png',
    width: 32,
    height: 32,
    transparentBackground: true,
    tags: ['角色'],
    metadata: { fallback: true }
  },
  {
    id: 'asset_2',
    name: '草地',
    type: '地图',
    fileName: 'grass_32x32.png',
    width: 32,
    height: 32,
    imageUrl: 'https://example.com/grass.png',
    transparentBackground: true,
    tags: ['地图'],
    metadata: { fallback: true }
  }
];

const manifest = createExportManifest(project, assets, {
  createdAt: '2026-05-23T00:00:00.000Z'
});

assert(manifest.project.id === 'forest-adventure', 'Expected project id');
assert(manifest.summary.total === 2, 'Expected total count');
assert(manifest.summary.sprites === 1, 'Expected sprite count');
assert(manifest.summary.tiles === 1, 'Expected tile count');
assert(manifest.summary.animations === 1, 'Expected animation count');
assert(manifest.summary.tileSets === 1, 'Expected tileset count');
assert(manifest.animations.length === 1, 'Expected animation manifest entry');
assert(manifest.tileSets.length === 1, 'Expected tileset manifest entry');
assert(manifest.directories.animations === 'res://spriteforge/animations', 'Expected animation directory');
assert(manifest.directories.tileSets === 'res://spriteforge/tilesets', 'Expected tileset directory');
assert(manifest.files[0].path === 'res://spriteforge/sprites/knight_32x32.png', 'Expected Godot sprite path');
assert(manifest.files[1].path === 'res://spriteforge/tiles/grass_32x32.png', 'Expected Godot tile path');
assert(manifest.files[1].imageUrl === 'https://example.com/grass.png', 'Expected generated image URL');
assert(createExportFileName(project) === 'forest-adventure_manifest.json', 'Expected manifest file name');

console.log('Export manifest tests passed.');

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}
