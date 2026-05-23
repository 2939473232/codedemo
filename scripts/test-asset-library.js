import {
  createLibraryAssetsFromJob,
  filterLibraryAssets,
  getLibraryStats,
  mergeLibraryAssets
} from '../frontend/src/assetLibrary.js';

const job = {
  id: 'job_demo',
  createdAt: '2026-05-23T00:00:00.000Z',
  updatedAt: '2026-05-23T00:00:01.000Z',
  request: {
    projectId: 'forest-adventure',
    projectName: 'Forest Adventure',
    intendedUse: 'Player Character',
    style: { artStyle: 'Pixel Fantasy' }
  },
  result: {
    assets: [
      { id: 'asset_1', name: 'Knight', type: 'Character' },
      { id: 'asset_2', name: 'Grass', type: 'Tile' }
    ]
  }
};

const assets = createLibraryAssetsFromJob(job);
assert(assets.length === 2, 'Expected assets from completed job');
assert(assets[0].projectId === 'forest-adventure', 'Expected project id on library asset');
assert(assets[0].sourceJobId === 'job_demo', 'Expected source job id on library asset');

const merged = mergeLibraryAssets([{ id: 'asset_1', name: 'Old Knight', type: 'Character' }], assets);
assert(merged.length === 2, 'Expected merge to replace duplicate ids');
assert(merged[0].name === 'Knight', 'Expected incoming asset to win duplicate merge');

const filtered = filterLibraryAssets(merged, { projectId: 'forest-adventure', type: 'Tile' });
assert(filtered.length === 1, 'Expected type filter to work');

const stats = getLibraryStats(merged, 'forest-adventure');
assert(stats.total === 2, 'Expected total stats');
assert(stats.sprites === 1, 'Expected sprite stats');
assert(stats.tiles === 1, 'Expected tile stats');

console.log('Asset library tests passed.');

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}
