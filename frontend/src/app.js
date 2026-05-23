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
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function buildGeneratedAssets(formData) {
  const type = formData.get('assetType');
  const prompt = String(formData.get('prompt') || 'forest asset');
  const count = Number(formData.get('count') || 4);
  const baseName = titleCase(prompt).slice(0, 34);
  const activePalette = project.palette.length ? project.palette : defaultPalette;

  return Array.from({ length: count }, (_, index) => ({
    name: `${baseName} ${index + 1}`,
    type,
    color: activePalette[index % activePalette.length],
    accent: activePalette[(index + 2) % activePalette.length],
    style: project.artStyle,
    engine: project.targetEngine
  }));
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
  jobStatus.textContent = 'Generating';
  jobStatus.className = 'chip';

  const formData = new FormData(generatorForm);

  window.setTimeout(() => {
    generatedAssets = buildGeneratedAssets(formData);
    renderAssets();
    jobStatus.textContent = 'Ready';
    jobStatus.className = 'chip success';
  }, 450);
});

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
renderProject();
renderAssets();
