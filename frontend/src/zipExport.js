const textEncoder = new TextEncoder();
const crcTable = createCrcTable();

export function createAssetSvg(asset) {
  const width = asset.width || 32;
  const height = asset.height || 32;
  const color = asset.color || '#35d0ff';
  const accent = asset.accent || '#ff4d6d';
  const name = escapeXml(asset.name || asset.id || 'asset');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="none"/>
  <rect x="${Math.floor(width * 0.22)}" y="${Math.floor(height * 0.16)}" width="${Math.ceil(width * 0.56)}" height="${Math.ceil(height * 0.62)}" rx="2" fill="${color}"/>
  <rect x="${Math.floor(width * 0.12)}" y="${Math.floor(height * 0.58)}" width="${Math.ceil(width * 0.3)}" height="${Math.ceil(height * 0.24)}" fill="${accent}"/>
  <rect x="${Math.floor(width * 0.62)}" y="${Math.floor(height * 0.22)}" width="${Math.ceil(width * 0.16)}" height="${Math.ceil(height * 0.16)}" fill="#ffffff" opacity="0.82"/>
  <title>${name}</title>
</svg>
`;
}

export function createExportReadme(manifest) {
  return [
    `# ${manifest.project.name}`,
    '',
    `目标引擎：${manifest.project.targetEngine}`,
    `美术风格：${manifest.project.artStyle}`,
    `素材数量：${manifest.summary.total}`,
    '',
    '此资源包由 SpriteForge fallback 导出流程生成。',
    'SVG 文件是原型阶段的轻量预览文件，后续可替换为真实 PNG 输出。',
    ''
  ].join('\n');
}

export function createExportPackageFiles(manifest) {
  const root = manifest.project.targetEngine === 'Unity' ? 'Assets/SpriteForge' : 'spriteforge';
  const manifestForZip = {
    ...manifest,
    files: manifest.files.map((file) => ({
      ...file,
      packagePath: normalizeZipPath(file.path)
    }))
  };
  const files = [
    {
      path: `${root}/manifest.json`,
      content: JSON.stringify(manifestForZip, null, 2)
    },
    {
      path: `${root}/README.md`,
      content: createExportReadme(manifest)
    }
  ];

  for (const file of manifest.files) {
    const svgPath = normalizeZipPath(file.path).replace(/\.png$/i, '.svg');
    files.push({
      path: svgPath,
      content: createAssetSvg(file)
    });
  }

  return files;
}

export function createZip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const fileName = textEncoder.encode(file.path);
    const content = typeof file.content === 'string' ? textEncoder.encode(file.content) : file.content;
    const crc = crc32(content);

    const localHeader = new Uint8Array(30 + fileName.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, content.length, true);
    localView.setUint32(22, content.length, true);
    localView.setUint16(26, fileName.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(fileName, 30);
    localParts.push(localHeader, content);

    const centralHeader = new Uint8Array(46 + fileName.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, content.length, true);
    centralView.setUint32(24, content.length, true);
    centralView.setUint16(28, fileName.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(fileName, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + content.length;
  }

  const centralOffset = offset;
  const centralSize = sumLength(centralParts);
  const endHeader = new Uint8Array(22);
  const endView = new DataView(endHeader.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, centralOffset, true);

  return concatUint8Arrays([...localParts, ...centralParts, endHeader]);
}

export function downloadZipFile(fileName, zipBytes) {
  const blob = new Blob([zipBytes], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function normalizeZipPath(path) {
  return path.replace(/^res:\/\//, '').replace(/\\/g, '/');
}

function concatUint8Arrays(parts) {
  const output = new Uint8Array(sumLength(parts));
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
}

function sumLength(parts) {
  return parts.reduce((total, part) => total + part.length, 0);
}

function crc32(bytes) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function createCrcTable() {
  return Array.from({ length: 256 }, (_, index) => {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    return value >>> 0;
  });
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
