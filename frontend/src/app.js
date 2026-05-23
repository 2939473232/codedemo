import {
  assetTypes,
  assetSizes,
  colorModes,
  createGenerationRequest,
  generationCounts,
  intendedUses,
  outlineModes,
  validateGenerationRequest
} from '../../shared/generationSchema.js';
import {
  createLibraryAssetsFromJob,
  filterLibraryAssets,
  getLibraryStats,
  libraryFilters,
  mergeLibraryAssets
} from './assetLibrary.js';

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

const projectStorageKey = 'spriteforge.project.v1';
const assetLibraryStorageKey = 'spriteforge.assetLibrary.v1';

const defaultPalette = ['#35d0ff', '#ff4d6d', '#ffd166', '#72ef9b', '#b8f7ff', '#f49f4d'];
const defaultAssetTypes = ['Character', 'Item', 'Icon', 'Tile'];

function createDefaultProject() {
  return {
    name: 'Forest Adventure',
    gameType: 'Top-down RPG',
    targetEngine: 'Godot',
    tileSize: '32x32',
    artStyle: 'Pixel Fantasy',
    cameraView: 'Top-down',
    palette: [...defaultPalette],
    assetTypes: [...defaultAssetTypes]
  };
}

const seedAssets = [
  { name: 'Red Scarf Knight', type: 'Character', fileName: 'red_scarf_knight_32x32.png', color: '#35d0ff', accent: '#ff4d6d' },
  { name: 'Iron Sword', type: 'Item', fileName: 'iron_sword_32x32.png', color: '#b8f7ff', accent: '#ffd166' },
  { name: 'Health Potion', type: 'Icon', fileName: 'health_potion_32x32.png', color: '#ff4d6d', accent: '#72ef9b' },
  { name: 'Forest Tile', type: 'Tile', fileName: 'forest_tile_32x32.png', color: '#72ef9b', accent: '#2b6f4a' }
];

let project = loadProject();
let generatedAssets = [...seedAssets];
let activeJob = null;
let savedAssets = loadSavedAssets();
let activeLibraryFilter = 'All';

function loadProject() {
  const fallbackProject = createDefaultProject();

  try {
    const storedProject = window.localStorage.getItem(projectStorageKey);
    if (!storedProject) {
      return fallbackProject;
    }

    const parsedProject = JSON.parse(storedProject);
    return {
      ...fallbackProject,
      ...parsedProject,
      palette: Array.isArray(parsedProject.palette) ? parsedProject.palette : fallbackProject.palette,
      assetTypes: Array.isArray(parsedProject.assetTypes) ? parsedProject.assetTypes : fallbackProject.assetTypes
    };
  } catch {
    return fallbackProject;
  }
}

function saveProject() {
  window.localStorage.setItem(projectStorageKey, JSON.stringify(project));
}

function loadSavedAssets() {
  try {
    const storedAssets = window.localStorage.getItem(assetLibraryStorageKey);
    return storedAssets ? JSON.parse(storedAssets) : [];
  } catch {
    return [];
  }
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
  libraryCount.textContent = `${stats.total} saved`;
  spriteCount.textContent = String(stats.sprites || generatedAssets.length);
  tileCount.textContent = String(stats.tiles || (project.tileSize === '32x32' ? 9 : 6));

  if (!visibleAssets.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No saved assets for this filter yet.';
    assetList.replaceChildren(empty);
  }
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
      <span>Color ${index + 1}</span>
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
  styleLockTitle.textContent = `${project.artStyle} Pack`;
  styleLockDescription.textContent = `${project.targetEngine} export, ${project.cameraView.toLowerCase()} view, ${project.tileSize} source grid, palette locked for repeatable asset batches.`;
  assetTypeCount.textContent = String(project.assetTypes.length);
  paletteCount.textContent = String(project.palette.length);
  manifestEngine.textContent = project.targetEngine;
  sizeSelect.value = project.tileSize;
  renderPaletteEditor();
  renderAssets();
  renderLibrary();
  renderRequestPreview();
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
  renderSelectOptions(generatorForm.elements.assetType, assetTypes);
  renderSelectOptions(generatorForm.elements.size, assetSizes);
  renderSelectOptions(generatorForm.elements.count, generationCounts);
  renderSelectOptions(generatorForm.elements.outlineMode, outlineModes);
  renderSelectOptions(generatorForm.elements.colorMode, colorModes);
  renderSelectOptions(generatorForm.elements.intendedUse, intendedUses);
}

function renderRequestPreview() {
  const request = createGenerationRequest(project, getGeneratorValues());
  const result = validateGenerationRequest(request);

  requestPreview.textContent = JSON.stringify(request, null, 2);
  validationList.replaceChildren(
    ...(result.valid ? [createValidationItem('Request schema valid', true)] : result.errors.map((error) => createValidationItem(error, false)))
  );

  return { request, result };
}

function renderJobStatus(job) {
  activeJob = job;
  activeJobId.textContent = job ? job.id : 'No active job';
  jobProgressValue.textContent = job ? `${job.progress}%` : '0%';
  jobProgressBar.style.width = job ? `${job.progress}%` : '0%';

  if (!job) {
    jobStatus.textContent = 'Idle';
    jobStatus.className = 'chip success';
    return;
  }

  jobStatus.textContent = titleCase(job.status);
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
    throw new Error(payload.details?.join('; ') || payload.error || 'Failed to create generation job');
  }

  return payload;
}

async function fetchGenerationJob(jobId) {
  const response = await fetch(`/api/generation/jobs/${jobId}`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to fetch generation job');
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
  jobStatus.textContent = 'Failed';
  jobStatus.className = 'chip danger';
  validationList.replaceChildren(createValidationItem(error.message, false));
}

function createValidationItem(message, valid) {
  const item = document.createElement('li');
  item.className = valid ? 'valid' : 'invalid';
  item.textContent = message;
  return item;
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
    jobStatus.textContent = 'Invalid';
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
    name: 'Untitled Asset Pack',
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
  const projectId = createGenerationRequest(project, getGeneratorValues()).projectId;
  savedAssets = savedAssets.filter((asset) => asset.projectId !== projectId);
  saveAssetLibrary();
  renderLibrary();
});

updateProjectForm();
initializeGeneratorSchemaControls();
renderLibraryFilters();
renderProject();
renderAssets();
renderLibrary();
renderJobStatus(activeJob);
