const assetGrid = document.querySelector('#assetGrid');
const assetList = document.querySelector('#assetList');
const generatorForm = document.querySelector('#generatorForm');
const jobStatus = document.querySelector('#jobStatus');
const spriteCount = document.querySelector('#spriteCount');

const palette = ['#35d0ff', '#ff4d6d', '#ffd166', '#72ef9b', '#b8f7ff', '#f49f4d'];

const seedAssets = [
  { name: 'Red Scarf Knight', type: 'Character', color: '#35d0ff', accent: '#ff4d6d' },
  { name: 'Iron Sword', type: 'Item', color: '#b8f7ff', accent: '#ffd166' },
  { name: 'Health Potion', type: 'Icon', color: '#ff4d6d', accent: '#72ef9b' },
  { name: 'Forest Tile', type: 'Tile', color: '#72ef9b', accent: '#2b6f4a' }
];

let generatedAssets = [...seedAssets];

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

  return Array.from({ length: count }, (_, index) => ({
    name: `${baseName} ${index + 1}`,
    type,
    color: palette[index % palette.length],
    accent: palette[(index + 2) % palette.length]
  }));
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

renderAssets();
