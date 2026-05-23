export const libraryFilters = ['All', 'Character', 'Enemy', 'Item', 'Icon', 'Tile', 'UI', 'Effect'];

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

export function filterLibraryAssets(assets, { projectId, type = 'All' }) {
  return assets.filter((asset) => {
    const matchesProject = asset.projectId === projectId;
    const matchesType = type === 'All' || asset.type === type;
    return matchesProject && matchesType;
  });
}

export function getLibraryStats(assets, projectId) {
  const projectAssets = filterLibraryAssets(assets, { projectId, type: 'All' });
  const byType = projectAssets.reduce((counts, asset) => {
    counts[asset.type] = (counts[asset.type] || 0) + 1;
    return counts;
  }, {});

  return {
    total: projectAssets.length,
    sprites: projectAssets.filter((asset) => asset.type !== 'Tile').length,
    tiles: byType.Tile || 0,
    byType
  };
}
