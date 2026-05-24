const defaultPalette = ['#35d0ff', '#ff4d6d', '#ffd166', '#72ef9b', '#b8f7ff', '#f49f4d'];

export function generateFallbackAssets(request) {
  const palette = normalizePalette(request.style.palette);
  const baseName = toAssetName(request.description);

  return Array.from({ length: request.count }, (_, index) => {
    const color = palette[index % palette.length];
    const accent = palette[(index + 2) % palette.length];
    const variant = index + 1;
    const assetName = request.count === 1 ? baseName : `${baseName} ${variant}`;
    const id = createStableId(`${request.projectId}:${request.assetType}:${request.description}:${variant}`);

    return {
      id,
      name: assetName,
      type: request.assetType,
      fileName: `${slugify(assetName)}_${request.size}.png`,
      width: request.dimensions.width,
      height: request.dimensions.height,
      color,
      accent,
      style: request.style.artStyle,
      engine: request.target.engine,
      transparentBackground: request.transparentBackground,
      metadata: {
        outlineMode: request.outlineMode,
        colorMode: request.colorMode,
        intendedUse: request.intendedUse,
        paletteLocked: request.paletteLock,
        fallback: true
      }
    };
  });
}

export function createFallbackManifest(request, assets, options = {}) {
  return {
    projectId: request.projectId,
    projectName: request.projectName,
    engine: request.target.engine,
    style: request.style.artStyle,
    size: request.size,
    generatedBy: options.generatedBy || 'fallback-generator',
    files: assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      path: `assets/${request.projectId}/${getAssetDirectory(asset.type)}/${asset.fileName}`,
      imageUrl: asset.imageUrl,
      width: asset.width,
      height: asset.height,
      type: asset.type,
      metadata: asset.metadata
    }))
  };
}

function normalizePalette(palette) {
  return Array.isArray(palette) && palette.length >= 2 ? palette : defaultPalette;
}

function toAssetName(description) {
  return String(description || '生成素材')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function getAssetDirectory(type) {
  const directories = {
    角色: 'sprites',
    敌人: 'sprites',
    道具: 'icons',
    图标: 'icons',
    地图: 'tiles',
    地块: 'tiles',
    界面元素: 'ui',
    特效: 'effects'
  };

  return directories[type] || 'sprites';
}

function slugify(value) {
  return String(value || 'asset')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'asset';
}

function createStableId(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return `asset_${hash.toString(16).padStart(8, '0')}`;
}
