export function createExportManifest(project, assets, options = {}) {
  const createdAt = options.createdAt || new Date().toISOString();
  const projectId = options.projectId || createProjectId(project.name);
  const engine = project.targetEngine || 'Godot';
  const root = options.root || createExportRoot(engine);
  const files = assets.map((asset) => createManifestFile(asset, root));

  return {
    manifestVersion: '2026-05-23.export.p0',
    createdAt,
    project: {
      id: projectId,
      name: project.name,
      gameType: project.gameType,
      targetEngine: engine,
      artStyle: project.artStyle,
      cameraView: project.cameraView,
      tileSize: project.tileSize,
      palette: project.palette
    },
    summary: {
      total: files.length,
      sprites: files.filter((file) => file.type !== '地块').length,
      tiles: files.filter((file) => file.type === '地块').length,
      formats: ['PNG', 'SVG 预览', 'JSON', 'ZIP']
    },
    directories: createDirectoryPlan(root),
    files
  };
}

export function downloadJsonFile(fileName, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function createExportFileName(project) {
  return `${createProjectId(project.name)}_manifest.json`;
}

function createManifestFile(asset, root) {
  const category = getAssetDirectory(asset.type);

  return {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    sourceJobId: asset.sourceJobId,
    path: `${root}/${category}/${asset.fileName || `${asset.id}.png`}`,
    width: asset.width || 32,
    height: asset.height || 32,
    transparentBackground: Boolean(asset.transparentBackground),
    tags: asset.tags || [],
    metadata: asset.metadata || {}
  };
}

function createDirectoryPlan(root) {
  return {
    sprites: `${root}/sprites`,
    tiles: `${root}/tiles`,
    icons: `${root}/icons`,
    ui: `${root}/ui`,
    effects: `${root}/effects`,
    manifest: `${root}/manifest.json`
  };
}

function getAssetDirectory(type) {
  const directories = {
    角色: 'sprites',
    敌人: 'sprites',
    道具: 'icons',
    图标: 'icons',
    地块: 'tiles',
    界面元素: 'ui',
    特效: 'effects'
  };

  return directories[type] || 'sprites';
}

function createExportRoot(engine) {
  return engine === 'Unity' ? 'Assets/SpriteForge' : 'res://spriteforge';
}

function createProjectId(name) {
  const trimmedName = String(name || '').trim();
  const namedSlugs = {
    森林冒险: 'forest-adventure',
    未命名素材包: 'untitled-asset-pack'
  };

  if (!trimmedName) {
    return 'untitled-project';
  }

  if (namedSlugs[trimmedName]) {
    return namedSlugs[trimmedName];
  }

  return trimmedName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'spriteforge-project';
}
