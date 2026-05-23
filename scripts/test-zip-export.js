import { createZip, createExportPackageFiles } from '../frontend/src/zipExport.js';

const manifest = {
  project: {
    name: '森林冒险',
    targetEngine: 'Godot',
    artStyle: '像素奇幻'
  },
  summary: {
    total: 1
  },
  files: [
    {
      id: 'asset_1',
      name: '骑士',
      type: '角色',
      path: 'res://spriteforge/sprites/knight_32x32.png',
      width: 32,
      height: 32,
      color: '#35d0ff',
      accent: '#ff4d6d'
    },
    {
      id: 'asset_2',
      name: '草地',
      type: '地块',
      path: 'res://spriteforge/tiles/grass_32x32.png',
      width: 32,
      height: 32,
      color: '#72ef9b',
      accent: '#2b6f4a'
    }
  ]
};

const files = createExportPackageFiles(manifest);
const zip = createZip(files);

assert(files.length === 9, 'Expected manifest, readme, previews, animation files, and tileset files');
assert(files.some((file) => file.path === 'spriteforge/manifest.json'), 'Expected manifest file');
assert(files.some((file) => file.path === 'spriteforge/README.md' && file.content.includes('地块套件：1')), 'Expected Chinese README file');
assert(files.some((file) => file.path.endsWith('knight_32x32.svg')), 'Expected SVG preview');
assert(files.some((file) => file.path === 'spriteforge/animations/knight_32x32_spritesheet.svg'), 'Expected spritesheet SVG');
assert(files.some((file) => file.path === 'spriteforge/animations/knight_32x32_frames.json'), 'Expected frame metadata');
assert(files.some((file) => file.path === 'spriteforge/tilesets/grass_32x32_tileset.svg'), 'Expected tileset SVG');
assert(files.some((file) => file.path === 'spriteforge/tilesets/grass_32x32_tileset.json'), 'Expected tileset metadata');
assert(files.some((file) => file.path === 'spriteforge/tilesets/grass_32x32_preview.json'), 'Expected tile map preview');
assert(zip[0] === 0x50 && zip[1] === 0x4b, 'Expected ZIP signature');
assert(zip.length > 200, 'Expected non-empty ZIP payload');

console.log('ZIP export tests passed.');

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}
