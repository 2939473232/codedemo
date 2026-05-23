import {
  artStyles,
  assetTypes,
  assetSizes,
  cameraViews,
  colorModes,
  createGenerationRequest,
  gameTypes,
  generationCounts,
  intendedUses,
  outlineModes,
  targetEngines,
  validateGenerationRequest
} from '../../shared/generationSchema.js';
import {
  createLibraryAssetsFromJob,
  filterLibraryAssets,
  getLibraryStats,
  libraryFilters,
  mergeLibraryAssets
} from './assetLibrary.js';
import { createExportFileName, createExportManifest, downloadJsonFile } from './exportManifest.js';
import { createSpriteSheet, getAnimatedAssets } from './spriteSheet.js';
import { createExportPackageFiles, createZip, downloadZipFile } from './zipExport.js';

const assetGrid = document.querySelector('#assetGrid');
const assetList = document.querySelector('#assetList');
const generatorForm = document.querySelector('#generatorForm');
const jobStatus = document.querySelector('#jobStatus');
const spriteCount = document.querySelector('#spriteCount');
const tileCount = document.querySelector('#tileCount');
const manifestEngine = document.querySelector('#manifestEngine');
const projectForm = document.querySelector('#projectForm');
const newProjectButton = document.querySelector('#newProjectButton');
const resetProjectButton = document.querySelector('#resetProjectButton');
const paletteEditor = document.querySelector('#paletteEditor');
const paletteStrip = document.querySelector('#paletteStrip');
const projectTitle = document.querySelector('#projectTitle');
const engineBadge = document.querySelector('#engineBadge');
const sizeBadge = document.querySelector('#sizeBadge');
const styleBadge = document.querySelector('#styleBadge');
const styleSummary = document.querySelector('#styleSummary');
const styleLockTitle = document.querySelector('#styleLockTitle');
const styleLockDescription = document.querySelector('#styleLockDescription');
const assetTypeCount = document.querySelector('#assetTypeCount');
const paletteCount = document.querySelector('#paletteCount');
const sizeSelect = document.querySelector('#size');
const requestPreview = document.querySelector('#requestPreview');
const validationList = document.querySelector('#validationList');
const activeJobId = document.querySelector('#activeJobId');
const jobProgressBar = document.querySelector('#jobProgressBar');
const jobProgressValue = document.querySelector('#jobProgressValue');
const libraryFiltersElement = document.querySelector('#libraryFilters');
const libraryCount = document.querySelector('#libraryCount');
const clearLibraryButton = document.querySelector('#clearLibraryButton');
const downloadManifestButton = document.querySelector('#downloadManifestButton');
const downloadZipButton = document.querySelector('#downloadZipButton');
const manifestPreview = document.querySelector('#manifestPreview');
const manifestRoot = document.querySelector('#manifestRoot');
const packageFileCount = document.querySelector('#packageFileCount');
const animationStage = document.querySelector('#animationStage');
const animationStatus = document.querySelector('#animationStatus');
const animationTitle = document.querySelector('#animationTitle');
const animationDescription = document.querySelector('#animationDescription');
const frameStrip = document.querySelector('#frameStrip');

const projectStorageKey = 'spriteforge.project.v1';
const assetLibraryStorageKey = 'spriteforge.assetLibrary.v1';

const defaultPalette = ['#35d0ff', '#ff4d6d', '#ffd166', '#72ef9b', '#b8f7ff', '#f49f4d'];
const defaultAssetTypes = ['角色', '道具', '图标', '地块'];
const legacyLabelMap = {
  'Forest Adventure': '森林冒险',
  'Untitled Asset Pack': '未命名素材包',
  'Top-down RPG': '俯视角 RPG',
  Platformer: '平台跳跃',
  'Card Battler': '卡牌战斗',
  'Pixel Fantasy': '像素奇幻',
  'Hand Painted': '手绘卡通',
  'Cyber Neon': '赛博霓虹',
  'Dark Gothic': '暗黑哥特',
  'Cute Chibi': 'Q 版可爱',
  'Top-down': '俯视角',
  'Side View': '侧视角',
  Isometric: '等距视角',
  'Icon Front': '图标正面',
  Character: '角色',
  Enemy: '敌人',
  Item: '道具',
  Icon: '图标',
  Tile: '地块',
  UI: '界面元素',
  Effect: '特效',
  All: '全部',
  None: '无',
  Light: '轻描边',
  Medium: '中描边',
  Bold: '粗描边',
  'Project Palette': '项目调色板',
  'Free Palette': '自由配色',
  Monochrome: '单色',
  'Player Character': '玩家角色',
  'Enemy Sprite': '敌人精灵',
  'Inventory Icon': '背包图标',
  'Map Tile': '地图地块',
  'UI Element': '界面元素',
  'Effect Frame': '特效帧'
};

function createDefaultProject() {
  return {
    name: '森林冒险',
    gameType: '俯视角 RPG',
    targetEngine: 'Godot',
    tileSize: '32x32',
    artStyle: '像素奇幻',
    cameraView: '俯视角',
    palette: [...defaultPalette],
    assetTypes: [...defaultAssetTypes]
  };
}

const seedAssets = [
  { name: '红围巾骑士', type: '角色', fileName: 'red_scarf_knight_32x32.png', color: '#35d0ff', accent: '#ff4d6d' },
  { name: '铁剑', type: '道具', fileName: 'iron_sword_32x32.png', color: '#b8f7ff', accent: '#ffd166' },
  { name: '治疗药水', type: '图标', fileName: 'health_potion_32x32.png', color: '#ff4d6d', accent: '#72ef9b' },
  { name: '森林地块', type: '地块', fileName: 'forest_tile_32x32.png', color: '#72ef9b', accent: '#2b6f4a' }
];

let project = loadProject();
let generatedAssets = [...seedAssets];
let activeJob = null;
let savedAssets = loadSavedAssets();
let activeLibraryFilter = '全部';

function loadProject() {
  const fallbackProject = createDefaultProject();

  try {
    const storedProject = window.localStorage.getItem(projectStorageKey);
    if (!storedProject) {
      return fallbackProject;
    }

    const parsedProject = JSON.parse(storedProject);
    return localizeLegacyProject({
      ...fallbackProject,
      ...parsedProject,
      palette: Array.isArray(parsedProject.palette) ? parsedProject.palette : fallbackProject.palette,
      assetTypes: Array.isArray(parsedProject.assetTypes) ? parsedProject.assetTypes : fallbackProject.assetTypes
    });
  } catch {
    return fallbackProject;
  }
}

function localizeLegacyProject(candidateProject) {
  return {
    ...candidateProject,
    name: localizeLegacyValue(candidateProject.name),
    gameType: localizeLegacyValue(candidateProject.gameType),
    artStyle: localizeLegacyValue(candidateProject.artStyle),
    cameraView: localizeLegacyValue(candidateProject.cameraView),
    assetTypes: Array.isArray(candidateProject.assetTypes)
      ? candidateProject.assetTypes.map(localizeLegacyValue)
      : [...defaultAssetTypes]
  };
}

function saveProject() {
  window.localStorage.setItem(projectStorageKey, JSON.stringify(project));
}

function loadSavedAssets() {
  try {
    const storedAssets = window.localStorage.getItem(assetLibraryStorageKey);
    const parsedAssets = storedAssets ? JSON.parse(storedAssets) : [];
    return Array.isArray(parsedAssets) ? parsedAssets.map(localizeLegacyAsset) : [];
  } catch {
    return [];
  }
}

function localizeLegacyAsset(asset) {
  return {
    ...asset,
    type: localizeLegacyValue(asset.type),
    projectName: localizeLegacyValue(asset.projectName),
    tags: Array.isArray(asset.tags) ? asset.tags.map(localizeLegacyValue) : asset.tags,
    metadata: asset.metadata
      ? {
          ...asset.metadata,
          outlineMode: localizeLegacyValue(asset.metadata.outlineMode),
          colorMode: localizeLegacyValue(asset.metadata.colorMode),
          intendedUse: localizeLegacyValue(asset.metadata.intendedUse)
        }
      : asset.metadata
  };
}

function localizeLegacyValue(value) {
  return legacyLabelMap[value] || value;
}

function saveAssetLibrary() {
  window.localStorage.setItem(assetLibraryStorageKey, JSON.stringify(savedAssets));
}

function createPixelPreview(asset, index) {
  const cell = document.createElement('article');
  cell.className = 'asset-card';
  const preview = document.createElement('div');
  preview.className = 'pixel-art';
  preview.style.setProperty('--asset-color', asset.color);
  preview.style.setProperty('--asset-accent', asset.accent);

  const core = document.createElement('span');
  core.className = 'pixel-core';
  const shine = document.createElement('span');
  shine.className = 'pixel-shine';
  preview.append(core, shine);

  const details = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = asset.name;
  const meta = document.createElement('p');
  meta.textContent = `${asset.type} / ${asset.width || 32}x${asset.height || 32} / v${index + 1}`;
  details.append(title, meta);

  cell.append(preview, details);
  return cell;
}

function renderAssets() {
  assetGrid.replaceChildren(...generatedAssets.map(createPixelPreview));
  renderAnimationPreview();
}

function renderLibrary() {
  const projectId = createGenerationRequest(project, getGeneratorValues()).projectId;
  const visibleAssets = filterLibraryAssets(savedAssets, {
    projectId,
    type: activeLibraryFilter
  });
  const stats = getLibraryStats(savedAssets, projectId);

  const listItems = visibleAssets.map((asset) => {
    const item = document.createElement('button');
    item.className = 'queue-item';
    item.type = 'button';
    const swatch = document.createElement('span');
    swatch.className = 'mini-swatch';
    swatch.style.background = asset.color;
    const copy = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = asset.name;
    const meta = document.createElement('small');
    meta.textContent = `${asset.type} / ${asset.fileName || asset.id}`;
    copy.append(title, meta);
    item.append(swatch, copy);
    return item;
  });

  assetList.replaceChildren(...listItems);
  libraryCount.textContent = `已保存 ${stats.total}`;
  spriteCount.textContent = String(stats.sprites || generatedAssets.length);
  tileCount.textContent = String(stats.tiles || (project.tileSize === '32x32' ? 9 : 6));
  renderExportCenter();

  if (!visibleAssets.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = '当前筛选下还没有已保存素材。';
    assetList.replaceChildren(empty);
  }
}

function getCurrentProjectId() {
  return createGenerationRequest(project, getGeneratorValues()).projectId;
}

function getCurrentProjectAssets() {
  return filterLibraryAssets(savedAssets, {
    projectId: getCurrentProjectId(),
    type: '全部'
  });
}

function renderExportCenter() {
  const manifest = createExportManifest(project, getCurrentProjectAssets(), {
    projectId: getCurrentProjectId()
  });
  const packageFiles = createExportPackageFiles(manifest);

  manifestEngine.textContent = manifest.project.targetEngine;
  manifestRoot.textContent = manifest.project.targetEngine === 'Unity' ? 'Assets/SpriteForge' : 'res://spriteforge';
  manifestPreview.textContent = JSON.stringify(manifest, null, 2);
  packageFileCount.textContent = `${packageFiles.length} 个文件`;
  downloadManifestButton.disabled = manifest.summary.total === 0;
  downloadZipButton.disabled = manifest.summary.total === 0;
}

function renderLibraryFilters() {
  const controls = libraryFilters.map((filter) => {
    const button = document.createElement('button');
    button.className = filter === activeLibraryFilter ? 'filter-pill active' : 'filter-pill';
    button.type = 'button';
    button.textContent = filter;
    button.addEventListener('click', () => {
      activeLibraryFilter = filter;
      renderLibraryFilters();
      renderLibrary();
    });
    return button;
  });

  libraryFiltersElement.replaceChildren(...controls);
}

function renderPaletteEditor() {
  const paletteInputs = project.palette.map((color, index) => {
    const label = document.createElement('label');
    label.className = 'color-control';
    label.innerHTML = `
      <span>颜色 ${index + 1}</span>
      <input type="color" value="${color}" data-palette-index="${index}" />
    `;
    return label;
  });

  paletteEditor.replaceChildren(...paletteInputs);

  const stripSwatches = project.palette.map((color) => {
    const swatch = document.createElement('span');
    swatch.style.background = color;
    return swatch;
  });

  paletteStrip.replaceChildren(...stripSwatches);
}

function updateProjectForm() {
  projectForm.elements.name.value = project.name;
  projectForm.elements.gameType.value = project.gameType;
  projectForm.elements.targetEngine.value = project.targetEngine;
  projectForm.elements.tileSize.value = project.tileSize;
  projectForm.elements.artStyle.value = project.artStyle;
  projectForm.elements.cameraView.value = project.cameraView;
}

function renderProject() {
  projectTitle.textContent = project.name;
  engineBadge.textContent = project.targetEngine;
  sizeBadge.textContent = project.tileSize;
  styleBadge.textContent = project.artStyle;
  styleSummary.textContent = `${project.artStyle} / ${project.cameraView} / ${project.gameType}`;
  styleLockTitle.textContent = `${project.artStyle}素材包`;
  styleLockDescription.textContent = `${project.targetEngine} 导出，${project.cameraView}，${project.tileSize} 源网格，锁定调色板以保持批量素材风格一致。`;
  assetTypeCount.textContent = String(project.assetTypes.length);
  paletteCount.textContent = String(project.palette.length);
  manifestEngine.textContent = project.targetEngine;
  sizeSelect.value = project.tileSize;
  renderPaletteEditor();
  renderAssets();
  renderLibrary();
  renderRequestPreview();
  renderAnimationPreview();
}

function renderAnimationPreview() {
  const [asset] = getAnimatedAssets(generatedAssets);

  if (!asset) {
    animationStatus.textContent = '等待角色素材';
    animationTitle.textContent = '暂无可预览角色';
    animationDescription.textContent = '生成角色或敌人素材后，这里会自动展示 idle/walk 帧序列。';
    animationStage.replaceChildren(createAnimationEmptyState());
    frameStrip.replaceChildren();
    return;
  }

  const sheet = createSpriteSheet(asset);
  const currentFrame = sheet.frames.find((frame) => frame.action === 'walk' && frame.frame === 1) || sheet.frames[0];
  animationStatus.textContent = `${sheet.frames.length} 帧`;
  animationTitle.textContent = `${asset.name} 动画包`;
  animationDescription.textContent = `${sheet.frameWidth}x${sheet.frameHeight} 单帧，${sheet.columns} 列 x ${sheet.rows} 行，包含待机 / 行走，可随 ZIP 导出帧坐标 JSON。`;
  animationStage.replaceChildren(createAnimationFrame(asset, currentFrame, 'large'));
  frameStrip.replaceChildren(...sheet.frames.map((frame) => createAnimationFrame(asset, frame, 'small')));
}

function createAnimationEmptyState() {
  const empty = document.createElement('p');
  empty.className = 'empty-state';
  empty.textContent = '当前结果没有角色或敌人素材。';
  return empty;
}

function createAnimationFrame(asset, frame, size) {
  const frameElement = document.createElement('span');
  frameElement.className = `animation-frame ${size}`;
  frameElement.title = formatFrameLabel(frame);
  frameElement.style.setProperty('--asset-color', asset.color || '#35d0ff');
  frameElement.style.setProperty('--asset-accent', asset.accent || '#ff4d6d');
  frameElement.style.setProperty('--step-offset', getFrameStepOffset(frame));
  frameElement.style.setProperty('--breathe-offset', frame.action === 'idle' && frame.frame % 2 === 0 ? '1px' : '0px');
  frameElement.dataset.action = frame.action;

  const body = document.createElement('i');
  body.className = 'animation-body';
  const shine = document.createElement('i');
  shine.className = 'animation-shine';
  const leftFoot = document.createElement('i');
  leftFoot.className = 'animation-foot left';
  const rightFoot = document.createElement('i');
  rightFoot.className = 'animation-foot right';
  frameElement.append(body, shine, leftFoot, rightFoot);
  return frameElement;
}

function getFrameStepOffset(frame) {
  if (frame.action !== 'walk') {
    return '0px';
  }

  return frame.frame % 2 === 0 ? '-2px' : '2px';
}

function formatFrameLabel(frame) {
  const actionLabel = frame.action === 'walk' ? '行走' : '待机';
  return `${actionLabel} ${frame.frame + 1}`;
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function getGeneratorValues() {
  const formData = new FormData(generatorForm);

  return {
    assetType: formData.get('assetType'),
    description: formData.get('description'),
    size: formData.get('size'),
    count: formData.get('count'),
    transparentBackground: generatorForm.elements.transparent.checked,
    paletteLock: generatorForm.elements.paletteLock.checked,
    outlineMode: formData.get('outlineMode'),
    colorMode: formData.get('colorMode'),
    intendedUse: formData.get('intendedUse')
  };
}

function renderSelectOptions(selectElement, values) {
  selectElement.replaceChildren(
    ...values.map((value) => {
      const option = document.createElement('option');
      option.value = String(value);
      option.textContent = String(value);
      return option;
    })
  );
}

function initializeGeneratorSchemaControls() {
  renderSelectOptions(projectForm.elements.gameType, gameTypes);
  renderSelectOptions(projectForm.elements.targetEngine, targetEngines);
  renderSelectOptions(projectForm.elements.artStyle, artStyles);
  renderSelectOptions(projectForm.elements.cameraView, cameraViews);
  renderSelectOptions(generatorForm.elements.assetType, assetTypes);
  renderSelectOptions(generatorForm.elements.size, assetSizes);
  renderSelectOptions(generatorForm.elements.count, generationCounts);
  renderSelectOptions(generatorForm.elements.outlineMode, outlineModes);
  renderSelectOptions(generatorForm.elements.colorMode, colorModes);
  renderSelectOptions(generatorForm.elements.intendedUse, intendedUses);

  generatorForm.elements.assetType.value = '角色';
  generatorForm.elements.size.value = project.tileSize;
  generatorForm.elements.count.value = '4';
  generatorForm.elements.outlineMode.value = '中描边';
  generatorForm.elements.colorMode.value = '项目调色板';
  generatorForm.elements.intendedUse.value = '玩家角色';
}

function renderRequestPreview() {
  const request = createGenerationRequest(project, getGeneratorValues());
  const result = validateGenerationRequest(request);

  requestPreview.textContent = JSON.stringify(request, null, 2);
  validationList.replaceChildren(
    ...(result.valid ? [createValidationItem('生成请求结构有效', true)] : result.errors.map((error) => createValidationItem(error, false)))
  );

  return { request, result };
}

function renderJobStatus(job) {
  activeJob = job;
  activeJobId.textContent = job ? job.id : '暂无任务';
  jobProgressValue.textContent = job ? `${job.progress}%` : '0%';
  jobProgressBar.style.width = job ? `${job.progress}%` : '0%';

  if (!job) {
    jobStatus.textContent = '空闲';
    jobStatus.className = 'chip success';
    return;
  }

  jobStatus.textContent = translateJobStatus(job.status);
  jobStatus.className = job.status === 'completed' ? 'chip success' : 'chip';
}

async function createGenerationJob(request) {
  const response = await fetch('/api/generation/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.details?.join('; ') || payload.error || '创建生成任务失败');
  }

  return payload;
}

async function fetchGenerationJob(jobId) {
  const response = await fetch(`/api/generation/jobs/${jobId}`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || '获取生成任务失败');
  }

  return payload;
}

async function pollGenerationJob(jobId) {
  const job = await fetchGenerationJob(jobId);
  renderJobStatus(job);

  if (job.status === 'completed') {
    generatedAssets = job.result?.assets || [];
    savedAssets = mergeLibraryAssets(savedAssets, createLibraryAssetsFromJob(job));
    saveAssetLibrary();
    renderAssets();
    renderLibrary();
    return;
  }

  window.setTimeout(() => {
    pollGenerationJob(jobId).catch(showJobError);
  }, 260);
}

function showJobError(error) {
  jobStatus.textContent = '失败';
  jobStatus.className = 'chip danger';
  validationList.replaceChildren(createValidationItem(error.message, false));
}

function createValidationItem(message, valid) {
  const item = document.createElement('li');
  item.className = valid ? 'valid' : 'invalid';
  item.textContent = message;
  return item;
}

function translateJobStatus(status) {
  const labels = {
    queued: '排队中',
    prompting: '提示词处理中',
    generating: '生成中',
    completed: '已完成'
  };

  return labels[status] || status;
}

function syncProjectFromForm() {
  const formData = new FormData(projectForm);
  project = {
    ...project,
    name: String(formData.get('name') || createDefaultProject().name).trim() || createDefaultProject().name,
    gameType: String(formData.get('gameType')),
    targetEngine: String(formData.get('targetEngine')),
    tileSize: String(formData.get('tileSize')),
    artStyle: String(formData.get('artStyle')),
    cameraView: String(formData.get('cameraView'))
  };
  saveProject();
  renderProject();
}

generatorForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const { request, result } = renderRequestPreview();

  if (!result.valid) {
    jobStatus.textContent = '无效请求';
    jobStatus.className = 'chip danger';
    return;
  }

  try {
    const job = await createGenerationJob(request);
    renderJobStatus(job);
    pollGenerationJob(job.id).catch(showJobError);
  } catch (error) {
    showJobError(error);
  }
});

generatorForm.addEventListener('input', renderRequestPreview);
generatorForm.addEventListener('change', renderRequestPreview);

projectForm.addEventListener('submit', (event) => {
  event.preventDefault();
  syncProjectFromForm();
});

projectForm.addEventListener('change', () => {
  syncProjectFromForm();
});

paletteEditor.addEventListener('input', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const paletteIndex = Number(input.dataset.paletteIndex);
  project.palette[paletteIndex] = input.value;
  saveProject();
  renderProject();
});

newProjectButton.addEventListener('click', () => {
  project = {
    ...createDefaultProject(),
    name: '未命名素材包',
    palette: ['#25c7ff', '#f24b6a', '#f3c567', '#67e69f', '#b8f7ff', '#a68cff']
  };
  generatedAssets = [];
  saveProject();
  updateProjectForm();
  renderProject();
});

resetProjectButton.addEventListener('click', () => {
  project = createDefaultProject();
  generatedAssets = [...seedAssets];
  saveProject();
  updateProjectForm();
  renderProject();
});

clearLibraryButton.addEventListener('click', () => {
  const projectId = getCurrentProjectId();
  savedAssets = savedAssets.filter((asset) => asset.projectId !== projectId);
  saveAssetLibrary();
  renderLibrary();
});

downloadManifestButton.addEventListener('click', () => {
  const manifest = createExportManifest(project, getCurrentProjectAssets(), {
    projectId: getCurrentProjectId()
  });
  downloadJsonFile(createExportFileName(project), manifest);
});

downloadZipButton.addEventListener('click', () => {
  const manifest = createExportManifest(project, getCurrentProjectAssets(), {
    projectId: getCurrentProjectId()
  });
  const packageFiles = createExportPackageFiles(manifest);
  const zipBytes = createZip(packageFiles);
  downloadZipFile(createExportFileName(project).replace('_manifest.json', '_asset_package.zip'), zipBytes);
});

initializeGeneratorSchemaControls();
updateProjectForm();
renderLibraryFilters();
renderProject();
renderAssets();
renderLibrary();
renderExportCenter();
renderJobStatus(activeJob);
