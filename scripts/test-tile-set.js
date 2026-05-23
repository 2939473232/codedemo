import {
  createTileMapPreview,
  createTileSet,
  createTileSetMetadata,
  createTileSetSvg,
  getTileAssets
} from '../frontend/src/tileSet.js';

const assets = [
  {
    id: 'asset_1',
    name: '草地',
    type: '地块',
    fileName: 'grass_32x32.png',
    width: 32,
    height: 32,
    color: '#72ef9b',
    accent: '#2b6f4a'
  },
  {
    id: 'asset_2',
    name: '骑士',
    type: '角色',
    fileName: 'knight_32x32.png',
    width: 32,
    height: 32
  }
];

const tileAssets = getTileAssets(assets);
const tileSet = createTileSet(tileAssets[0]);
const metadata = createTileSetMetadata(tileAssets[0]);
const preview = createTileMapPreview(tileAssets[0]);
const svg = createTileSetSvg(tileAssets[0]);

assert(tileAssets.length === 1, 'Expected only tile assets');
assert(tileSet.tiles.length === 9, 'Expected 3x3 tile variants');
assert(tileSet.width === 96 && tileSet.height === 96, 'Expected 3x3 sheet dimensions');
assert(metadata.tiles.some((tile) => tile.variant === 'top_left'), 'Expected corner metadata');
assert(preview.cells.length === 36, 'Expected 6x6 tile map preview');
assert(svg.includes('data-tile="center"'), 'Expected SVG tile markers');

console.log('Tile set tests passed.');

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}
