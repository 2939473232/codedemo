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

const projectStorageKey = 'spriteforge.project.v1';

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
  { name: 'Red Scarf Knight', type: 'Character', color: '#35d0ff', accent: '#ff4d6d' },
  { name: 'Iron Sword', type: 'Item', color: '#b8f7ff', accent: '#ffd166' },
  { name: 'Health Potion', type: 'Icon', color: '#ff4d6d', accent: '#72ef9b' },
  { name: 'Forest Tile', type: 'Tile', color: '#72ef9b', accent: '#2b6f4a' }
];

let project = loadProject();
let generatedAssets = [...seedAssets];

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

function createPixelPreview(asset, index) {
  const cell = document.createElement('article');
  cell.className = 'asset-card';
  cell.innerHTML = `
    <div class="pixel-art" style="--asset-color:${asset.color};--asset-accent:${asset.accent}">
      <span class="pixel-core"></span>
      <span class="pixel-shine"></span>
    </div>
    <div>
      <strong>${asset.name}</strong>
      <p>${asset.type} / v${index + 1}</p>
    </div>
  `;
  return cell;
}

function renderAssets() {
  assetGrid.replaceChildren(...generatedAssets.map(createPixelPreview));

  const listItems = generatedAssets.map((asset, index) => {
    const item = document.createElement('button');
    item.className = 'queue-item';
    item.type = 'button';
    item.innerHTML = `
      <span class="mini-swatch" style="background:${asset.color}"></span>
      <span>
        <strong>${asset.name}</strong>
        <small>${asset.type} / ${index + 1}.png</small>
      </span>
    `;
    return item;
  });

  assetList.replaceChildren(...listItems);
  spriteCount.textContent = String(generatedAssets.length);
  tileCount.textContent = project.tileSize === '32x32' ? '9' : '6';
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
  renderRequestPreview();
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function buildGeneratedAssets(request) {
  const baseName = titleCase(request.description).slice(0, 34);
  const activePalette = project.palette.length ? project.palette : defaultPalette;

  return Array.from({ length: request.count }, (_, index) => ({
    name: `${baseName} ${index + 1}`,
    type: request.assetType,
    color: activePalette[index % activePalette.length],
    accent: activePalette[(index + 2) % activePalette.length],
    style: request.style.artStyle,
    engine: request.target.engine
  }));
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

generatorForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const { request, result } = renderRequestPreview();

  if (!result.valid) {
    jobStatus.textContent = 'Invalid';
    jobStatus.className = 'chip danger';
    return;
  }

  jobStatus.textContent = 'Generating';
  jobStatus.className = 'chip';
  window.setTimeout(() => {
    generatedAssets = buildGeneratedAssets(request);
    renderAssets();
    jobStatus.textContent = 'Ready';
    jobStatus.className = 'chip success';
  }, 450);
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

updateProjectForm();
initializeGeneratorSchemaControls();
renderProject();
renderAssets();
