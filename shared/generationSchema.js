export const generationSchemaVersion = '2026-05-23.p0';

export const assetTypes = ['角色', '敌人', '道具', '图标', '地块', '界面元素', '特效'];
export const assetSizes = ['16x16', '32x32', '48x48', '64x64', '128x128'];
export const generationCounts = [1, 2, 4, 8];
export const outlineModes = ['无', '轻描边', '中描边', '粗描边'];
export const colorModes = ['项目调色板', '自由配色', '单色'];
export const gameTypes = ['俯视角 RPG', '平台跳跃', 'Roguelike', '卡牌战斗'];
export const artStyles = ['像素奇幻', '手绘卡通', '赛博霓虹', '暗黑哥特', 'Q 版可爱'];
export const cameraViews = ['俯视角', '侧视角', '等距视角', '图标正面'];
export const targetEngines = ['Godot', 'Unity', 'Cocos Creator', 'Tiled'];
export const intendedUses = [
  '玩家角色',
  '敌人精灵',
  '背包图标',
  '地图地块',
  '界面元素',
  '特效帧'
];

export const generationSchema = {
  version: generationSchemaVersion,
  projectFields: {
    gameType: { type: 'enum', required: true, values: gameTypes },
    targetEngine: { type: 'enum', required: true, values: targetEngines },
    tileSize: { type: 'enum', required: true, values: assetSizes },
    artStyle: { type: 'enum', required: true, values: artStyles },
    cameraView: { type: 'enum', required: true, values: cameraViews }
  },
  fields: {
    projectId: { type: 'string', required: true },
    projectName: { type: 'string', required: true, minLength: 1, maxLength: 32 },
    assetType: { type: 'enum', required: true, values: assetTypes },
    description: { type: 'string', required: true, minLength: 4, maxLength: 180 },
    size: { type: 'enum', required: true, values: assetSizes },
    count: { type: 'enum', required: true, values: generationCounts },
    transparentBackground: { type: 'boolean', required: true },
    paletteLock: { type: 'boolean', required: true },
    outlineMode: { type: 'enum', required: true, values: outlineModes },
    colorMode: { type: 'enum', required: true, values: colorModes },
    intendedUse: { type: 'enum', required: true, values: intendedUses },
    style: { type: 'object', required: true },
    target: { type: 'object', required: true }
  }
};

export function parseSize(size) {
  const [width, height] = String(size).split('x').map(Number);
  return { width, height };
}

export function createProjectId(name) {
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

export function createGenerationRequest(project, formValues) {
  const selectedSize = String(formValues.size || project.tileSize || '32x32');

  return {
    schemaVersion: generationSchemaVersion,
    projectId: createProjectId(project.name),
    projectName: String(project.name || '').trim(),
    assetType: String(formValues.assetType || '角色'),
    description: String(formValues.description || '').trim(),
    size: selectedSize,
    dimensions: parseSize(selectedSize),
    count: Number(formValues.count || 4),
    transparentBackground: Boolean(formValues.transparentBackground),
    paletteLock: Boolean(formValues.paletteLock),
    outlineMode: String(formValues.outlineMode || '中描边'),
    colorMode: String(formValues.colorMode || '项目调色板'),
    intendedUse: String(formValues.intendedUse || '玩家角色'),
    style: {
      artStyle: String(project.artStyle || '像素奇幻'),
      cameraView: String(project.cameraView || '俯视角'),
      gameType: String(project.gameType || '俯视角 RPG'),
      palette: Array.isArray(project.palette) ? project.palette : []
    },
    target: {
      engine: String(project.targetEngine || 'Godot'),
      tileSize: String(project.tileSize || selectedSize)
    },
    createdAt: new Date().toISOString()
  };
}

export function validateGenerationRequest(request) {
  const errors = [];

  if (request.schemaVersion !== generationSchemaVersion) {
    errors.push(`schemaVersion 必须为 ${generationSchemaVersion}`);
  }

  validateRequiredString(errors, request.projectId, 'projectId', 1, 48);
  validateRequiredString(errors, request.projectName, 'projectName', 1, 32);
  validateRequiredString(errors, request.description, 'description', 4, 180);
  validateEnum(errors, request.assetType, 'assetType', assetTypes);
  validateEnum(errors, request.size, 'size', assetSizes);
  validateEnum(errors, request.count, 'count', generationCounts);
  validateEnum(errors, request.outlineMode, 'outlineMode', outlineModes);
  validateEnum(errors, request.colorMode, 'colorMode', colorModes);
  validateEnum(errors, request.intendedUse, 'intendedUse', intendedUses);
  validateBoolean(errors, request.transparentBackground, 'transparentBackground');
  validateBoolean(errors, request.paletteLock, 'paletteLock');

  if (!request.dimensions || request.dimensions.width <= 0 || request.dimensions.height <= 0) {
    errors.push('dimensions 必须包含正数宽度和高度');
  }

  if (!request.style || typeof request.style !== 'object') {
    errors.push('style 必须包含项目风格信息');
  } else {
    validateEnum(errors, request.style.artStyle, 'style.artStyle', artStyles);
    validateEnum(errors, request.style.cameraView, 'style.cameraView', cameraViews);
    validateEnum(errors, request.style.gameType, 'style.gameType', gameTypes);

    if (!Array.isArray(request.style.palette) || request.style.palette.length < 2) {
      errors.push('style.palette 至少需要包含 2 个颜色');
    }
  }

  if (!request.target || !request.target.engine || !request.target.tileSize) {
    errors.push('target 必须包含 engine 和 tileSize');
  } else {
    validateEnum(errors, request.target.engine, 'target.engine', targetEngines);
    validateEnum(errors, request.target.tileSize, 'target.tileSize', assetSizes);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function validateRequiredString(errors, value, field, minLength, maxLength) {
  if (typeof value !== 'string') {
    errors.push(`${field} 必须是字符串`);
    return;
  }

  if (value.length < minLength) {
    errors.push(`${field} 至少需要 ${minLength} 个字符`);
  }

  if (value.length > maxLength) {
    errors.push(`${field} 最多允许 ${maxLength} 个字符`);
  }
}

function validateEnum(errors, value, field, values) {
  if (!values.includes(value)) {
    errors.push(`${field} 必须是以下值之一：${values.join('、')}`);
  }
}

function validateBoolean(errors, value, field) {
  if (typeof value !== 'boolean') {
    errors.push(`${field} 必须是布尔值`);
  }
}
