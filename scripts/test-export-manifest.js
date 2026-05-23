import { createExportFileName, createExportManifest } from '../frontend/src/exportManifest.js';

const project = {
  name: 'Forest Adventure',
  gameType: 'Top-down RPG',
  targetEngine: 'Godot',
  tileSize: '32x32',
  artStyle: 'Pixel Fantasy',
  cameraView: 'Top-down',
  palette: ['#35d0ff', '#ff4d6d']
};

const assets = [
  {
    id: 'asset_1',
    name: 'Knight',
    type: 'Character',
    fileName: 'knight_32x32.png',
    width: 32,
    height: 32,
    transparentBackground: true,
    tags: ['Character'],
    metadata: { fallback: true }
  },
  {
    id: 'asset_2',
    name: 'Grass',
    type: 'Tile',
    fileName: 'grass_32x32.png',
    width: 32,
    height: 32,
    transparentBackground: true,
    tags: ['Tile'],
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
assert(manifest.files[0].path === 'res://spriteforge/sprites/knight_32x32.png', 'Expected Godot sprite path');
assert(manifest.files[1].path === 'res://spriteforge/tiles/grass_32x32.png', 'Expected Godot tile path');
assert(createExportFileName(project) === 'forest-adventure_manifest.json', 'Expected manifest file name');

console.log('Export manifest tests passed.');

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}
