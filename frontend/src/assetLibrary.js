export const libraryFilters = ['全部', '角色', '敌人', '道具', '图标', '地图', '界面元素', '特效'];

export function createLibraryAssetsFromJob(job) {
  if (!job?.result?.assets || !job?.request) {
    return [];
  }

  return job.result.assets.map((asset) => ({
    ...asset,
    projectId: job.request.projectId,
    projectName: job.request.projectName,
    sourceJobId: job.id,
    version: 1,
    favorite: false,
    tags: [asset.type, job.request.intendedUse, job.request.style.artStyle],
    createdAt: job.updatedAt || job.createdAt
  }));
}

export function mergeLibraryAssets(existingAssets, incomingAssets) {
  const incomingIds = new Set(incomingAssets.map((asset) => asset.id));
  const retainedAssets = existingAssets.filter((asset) => !incomingIds.has(asset.id));
  return [...incomingAssets, ...retainedAssets];
}

export function filterLibraryAssets(assets, { projectId, type = '全部' }) {
  return assets.filter((asset) => {
    const matchesProject = asset.projectId === projectId;
    const normalizedType = asset.type === '地块' ? '地图' : asset.type;
    const matchesType = type === '全部' || normalizedType === type;
    return matchesProject && matchesType;
  });
}

export function getLibraryStats(assets, projectId) {
  const projectAssets = filterLibraryAssets(assets, { projectId, type: '全部' });
  const byType = projectAssets.reduce((counts, asset) => {
    const normalizedType = asset.type === '地块' ? '地图' : asset.type;
    counts[normalizedType] = (counts[normalizedType] || 0) + 1;
    return counts;
  }, {});

  return {
    total: projectAssets.length,
    sprites: projectAssets.filter((asset) => !['地图', '地块'].includes(asset.type)).length,
    tiles: byType.地图 || 0,
    byType
  };
}
