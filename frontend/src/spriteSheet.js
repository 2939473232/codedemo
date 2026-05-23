export const animationActions = ['idle', 'walk'];
export const animatedAssetTypes = ['角色', '敌人'];

export function getAnimatedAssets(assets) {
  return assets.filter((asset) => animatedAssetTypes.includes(asset.type));
}

export function createSpriteSheet(asset, options = {}) {
  const frameWidth = asset.width || 32;
  const frameHeight = asset.height || 32;
  const actions = options.actions || animationActions;
  const framesPerAction = options.framesPerAction || 4;
  const frames = [];

  actions.forEach((action, actionIndex) => {
    for (let frameIndex = 0; frameIndex < framesPerAction; frameIndex += 1) {
      frames.push({
        name: `${action}_${String(frameIndex + 1).padStart(2, '0')}`,
        action,
        frame: frameIndex,
        x: frameIndex * frameWidth,
        y: actionIndex * frameHeight,
        width: frameWidth,
        height: frameHeight,
        durationMs: action === 'idle' ? 180 : 120
      });
    }
  });

  return {
    assetId: asset.id,
    assetName: asset.name,
    sourceFile: asset.fileName,
    frameWidth,
    frameHeight,
    columns: framesPerAction,
    rows: actions.length,
    width: frameWidth * framesPerAction,
    height: frameHeight * actions.length,
    fps: 8,
    frames
  };
}

export function createSpriteSheetMetadata(asset, options = {}) {
  const sheet = createSpriteSheet(asset, options);

  return {
    type: 'spritesheet',
    assetId: sheet.assetId,
    assetName: sheet.assetName,
    sourceFile: sheet.sourceFile,
    frameSize: {
      width: sheet.frameWidth,
      height: sheet.frameHeight
    },
    imageSize: {
      width: sheet.width,
      height: sheet.height
    },
    fps: sheet.fps,
    animations: groupFramesByAction(sheet.frames)
  };
}

export function createSpriteSheetSvg(asset, options = {}) {
  const sheet = createSpriteSheet(asset, options);
  const color = asset.color || '#35d0ff';
  const accent = asset.accent || '#ff4d6d';
  const title = escapeXml(`${asset.name || asset.id} spritesheet`);
  const frameNodes = sheet.frames.map((frame) => createFrameNode(frame, color, accent)).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${sheet.width}" height="${sheet.height}" viewBox="0 0 ${sheet.width} ${sheet.height}">
  <title>${title}</title>
  <rect width="${sheet.width}" height="${sheet.height}" fill="none"/>
${frameNodes}
</svg>
`;
}

function groupFramesByAction(frames) {
  return frames.reduce((groups, frame) => {
    if (!groups[frame.action]) {
      groups[frame.action] = [];
    }

    groups[frame.action].push({
      name: frame.name,
      frame: frame.frame,
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
      durationMs: frame.durationMs
    });

    return groups;
  }, {});
}

function createFrameNode(frame, color, accent) {
  const bodyWidth = Math.ceil(frame.width * 0.48);
  const bodyHeight = Math.ceil(frame.height * 0.56);
  const stepOffset = frame.action === 'walk' ? (frame.frame % 2 === 0 ? -2 : 2) : 0;
  const breatheOffset = frame.action === 'idle' ? frame.frame % 2 : 0;
  const bodyX = frame.x + Math.floor((frame.width - bodyWidth) / 2) + stepOffset;
  const bodyY = frame.y + Math.floor(frame.height * 0.2) - breatheOffset;
  const footY = frame.y + Math.floor(frame.height * 0.76);
  const leftFootX = frame.x + Math.floor(frame.width * 0.25) - stepOffset;
  const rightFootX = frame.x + Math.floor(frame.width * 0.58) + stepOffset;

  return `  <g data-frame="${escapeXml(frame.name)}">
    <rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" fill="none"/>
    <rect x="${bodyX}" y="${bodyY}" width="${bodyWidth}" height="${bodyHeight}" rx="2" fill="${color}"/>
    <rect x="${bodyX + Math.floor(bodyWidth * 0.58)}" y="${bodyY + Math.floor(bodyHeight * 0.16)}" width="${Math.ceil(bodyWidth * 0.22)}" height="${Math.ceil(bodyHeight * 0.22)}" fill="#ffffff" opacity="0.82"/>
    <rect x="${leftFootX}" y="${footY}" width="${Math.ceil(frame.width * 0.2)}" height="${Math.ceil(frame.height * 0.12)}" fill="${accent}"/>
    <rect x="${rightFootX}" y="${footY}" width="${Math.ceil(frame.width * 0.2)}" height="${Math.ceil(frame.height * 0.12)}" fill="${accent}"/>
  </g>`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
