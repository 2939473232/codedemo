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
    projectName: '森林冒险',
    intendedUse: '玩家角色',
    style: { artStyle: '像素奇幻' }
  },
  result: {
    assets: [
      { id: 'asset_1', name: '骑士', type: '角色' },
      { id: 'asset_2', name: '草地', type: '地块' }
    ]
  }
};

const assets = createLibraryAssetsFromJob(job);
assert(assets.length === 2, 'Expected assets from completed job');
assert(assets[0].projectId === 'forest-adventure', 'Expected project id on library asset');
assert(assets[0].sourceJobId === 'job_demo', 'Expected source job id on library asset');

const merged = mergeLibraryAssets([{ id: 'asset_1', name: '旧骑士', type: '角色' }], assets);
assert(merged.length === 2, 'Expected merge to replace duplicate ids');
assert(merged[0].name === '骑士', 'Expected incoming asset to win duplicate merge');

const filtered = filterLibraryAssets(merged, { projectId: 'forest-adventure', type: '地块' });
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
