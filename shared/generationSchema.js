export const generationSchemaVersion = '2026-05-23.p0';

export const assetTypes = ['Character', 'Enemy', 'Item', 'Icon', 'Tile', 'UI', 'Effect'];
export const assetSizes = ['16x16', '32x32', '48x48', '64x64', '128x128'];
export const generationCounts = [1, 2, 4, 8];
export const outlineModes = ['None', 'Soft', 'Medium', 'Bold'];
export const colorModes = ['Project Palette', 'Free Color', 'Monochrome'];
export const intendedUses = [
  'Player Character',
  'Enemy Sprite',
  'Inventory Icon',
  'Map Tile',
  'UI Element',
  'VFX Frame'
];

export const generationSchema = {
  version: generationSchemaVersion,
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
  return String(name || 'untitled-project')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'untitled-project';
}

export function createGenerationRequest(project, formValues) {
  const selectedSize = String(formValues.size || project.tileSize || '32x32');

  return {
    schemaVersion: generationSchemaVersion,
    projectId: createProjectId(project.name),
    projectName: String(project.name || '').trim(),
    assetType: String(formValues.assetType || 'Character'),
    description: String(formValues.description || '').trim(),
    size: selectedSize,
    dimensions: parseSize(selectedSize),
    count: Number(formValues.count || 4),
    transparentBackground: Boolean(formValues.transparentBackground),
    paletteLock: Boolean(formValues.paletteLock),
    outlineMode: String(formValues.outlineMode || 'Medium'),
    colorMode: String(formValues.colorMode || 'Project Palette'),
    intendedUse: String(formValues.intendedUse || 'Player Character'),
    style: {
      artStyle: String(project.artStyle || 'Pixel Fantasy'),
      cameraView: String(project.cameraView || 'Top-down'),
      gameType: String(project.gameType || 'Top-down RPG'),
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
    errors.push(`schemaVersion must be ${generationSchemaVersion}`);
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
    errors.push('dimensions must include positive width and height');
  }

  if (!request.style || !Array.isArray(request.style.palette) || request.style.palette.length < 2) {
    errors.push('style.palette must include at least 2 colors');
  }

  if (!request.target || !request.target.engine || !request.target.tileSize) {
    errors.push('target must include engine and tileSize');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function validateRequiredString(errors, value, field, minLength, maxLength) {
  if (typeof value !== 'string') {
    errors.push(`${field} must be a string`);
    return;
  }

  if (value.length < minLength) {
    errors.push(`${field} must be at least ${minLength} characters`);
  }

  if (value.length > maxLength) {
    errors.push(`${field} must be at most ${maxLength} characters`);
  }
}

function validateEnum(errors, value, field, values) {
  if (!values.includes(value)) {
    errors.push(`${field} must be one of: ${values.join(', ')}`);
  }
}

function validateBoolean(errors, value, field) {
  if (typeof value !== 'boolean') {
    errors.push(`${field} must be boolean`);
  }
}
