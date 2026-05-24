export const tileAssetTypes = ['地图', '地块'];
export const tileVariants = [
  { id: 'center', name: '中心', row: 1, column: 1, terrain: 'grass' },
  { id: 'top', name: '上边缘', row: 0, column: 1, terrain: 'edge' },
  { id: 'right', name: '右边缘', row: 1, column: 2, terrain: 'edge' },
  { id: 'bottom', name: '下边缘', row: 2, column: 1, terrain: 'edge' },
  { id: 'left', name: '左边缘', row: 1, column: 0, terrain: 'edge' },
  { id: 'top_left', name: '左上角', row: 0, column: 0, terrain: 'corner' },
  { id: 'top_right', name: '右上角', row: 0, column: 2, terrain: 'corner' },
  { id: 'bottom_right', name: '右下角', row: 2, column: 2, terrain: 'corner' },
  { id: 'bottom_left', name: '左下角', row: 2, column: 0, terrain: 'corner' }
];

export function getTileAssets(assets) {
  return assets.filter((asset) => tileAssetTypes.includes(asset.type));
}

export function createTileSet(asset, options = {}) {
  const tileWidth = asset.width || 32;
  const tileHeight = asset.height || 32;
  const columns = options.columns || 3;
  const rows = options.rows || 3;
  const tiles = tileVariants.map((variant, index) => ({
    id: `${asset.id}_${variant.id}`,
    name: variant.name,
    variant: variant.id,
    terrain: variant.terrain,
    index,
    x: variant.column * tileWidth,
    y: variant.row * tileHeight,
    width: tileWidth,
    height: tileHeight
  }));

  return {
    assetId: asset.id,
    assetName: asset.name,
    sourceFile: asset.fileName,
    tileWidth,
    tileHeight,
    columns,
    rows,
    width: tileWidth * columns,
    height: tileHeight * rows,
    tiles
  };
}

export function createTileMapPreview(asset, options = {}) {
  const sheet = createTileSet(asset, options);
  const pattern = [
    ['top_left', 'top', 'top', 'top_right', 'center', 'center'],
    ['left', 'center', 'center', 'right', 'center', 'center'],
    ['left', 'center', 'center', 'bottom_right', 'bottom', 'bottom_left'],
    ['bottom_left', 'bottom', 'bottom', 'center', 'center', 'right'],
    ['center', 'center', 'top_left', 'top', 'top_right', 'right'],
    ['center', 'center', 'left', 'bottom', 'bottom_right', 'center']
  ];

  return {
    assetId: asset.id,
    tileWidth: sheet.tileWidth,
    tileHeight: sheet.tileHeight,
    columns: pattern[0].length,
    rows: pattern.length,
    cells: pattern.flatMap((row, y) =>
      row.map((variant, x) => ({
        x,
        y,
        variant
      }))
    )
  };
}

export function createTileSetMetadata(asset, options = {}) {
  const sheet = createTileSet(asset, options);

  return {
    type: 'tileset',
    assetId: sheet.assetId,
    assetName: sheet.assetName,
    sourceFile: sheet.sourceFile,
    tileSize: {
      width: sheet.tileWidth,
      height: sheet.tileHeight
    },
    imageSize: {
      width: sheet.width,
      height: sheet.height
    },
    columns: sheet.columns,
    rows: sheet.rows,
    tiles: sheet.tiles
  };
}

export function createTileSetSvg(asset, options = {}) {
  if (asset.imageUrl) {
    return createImageBasedTileSetSvg(asset, options);
  }

  const sheet = createTileSet(asset, options);
  const color = asset.color || '#72ef9b';
  const accent = asset.accent || '#2b6f4a';
  const title = escapeXml(`${asset.name || asset.id} tileset`);
  const nodes = sheet.tiles.map((tile) => createTileNode(tile, color, accent)).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${sheet.width}" height="${sheet.height}" viewBox="0 0 ${sheet.width} ${sheet.height}">
  <title>${title}</title>
  <rect width="${sheet.width}" height="${sheet.height}" fill="none"/>
${nodes}
</svg>
`;
}

function createImageBasedTileSetSvg(asset, options = {}) {
  const sheet = createTileSet(asset, options);
  const title = escapeXml(`${asset.name || asset.id} tileset`);
  const imageUrl = escapeXml(asset.imageUrl);
  const nodes = sheet.tiles.map((tile) => `  <g data-tile="${escapeXml(tile.variant)}">
    <rect x="${tile.x}" y="${tile.y}" width="${tile.width}" height="${tile.height}" fill="#0c1118"/>
    <image href="${imageUrl}" x="${tile.x}" y="${tile.y}" width="${tile.width}" height="${tile.height}" preserveAspectRatio="xMidYMid slice"/>
  </g>`).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${sheet.width}" height="${sheet.height}" viewBox="0 0 ${sheet.width} ${sheet.height}">
  <title>${title}</title>
  <rect width="${sheet.width}" height="${sheet.height}" fill="none"/>
${nodes}
</svg>
`;
}

function createTileNode(tile, color, accent) {
  const edge = Math.max(3, Math.floor(tile.width * 0.16));
  const innerX = tile.x + edge;
  const innerY = tile.y + edge;
  const innerWidth = tile.width - edge * 2;
  const innerHeight = tile.height - edge * 2;
  const edgeColor = tile.terrain === 'grass' ? color : accent;
  const fillColor = tile.terrain === 'corner' ? mixColor(color, '#0c1118', 0.24) : color;

  return `  <g data-tile="${escapeXml(tile.variant)}">
    <rect x="${tile.x}" y="${tile.y}" width="${tile.width}" height="${tile.height}" fill="${edgeColor}"/>
    <rect x="${innerX}" y="${innerY}" width="${innerWidth}" height="${innerHeight}" fill="${fillColor}"/>
    <path d="${createDetailPath(tile)}" fill="${accent}" opacity="0.48"/>
  </g>`;
}

function createDetailPath(tile) {
  const left = tile.x + Math.floor(tile.width * 0.2);
  const top = tile.y + Math.floor(tile.height * 0.22);
  const right = tile.x + Math.floor(tile.width * 0.78);
  const bottom = tile.y + Math.floor(tile.height * 0.72);

  return `M ${left} ${bottom} L ${Math.floor((left + right) / 2)} ${top} L ${right} ${bottom} Z`;
}

function mixColor(color, fallback, amount) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) {
    return fallback;
  }

  const base = parseInt(color.slice(1), 16);
  const target = parseInt(fallback.slice(1), 16);
  const channels = [16, 8, 0].map((shift) => {
    const baseValue = (base >> shift) & 255;
    const targetValue = (target >> shift) & 255;
    return Math.round(baseValue * (1 - amount) + targetValue * amount);
  });

  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
