import {
  createGenerationRequest,
  generationSchemaVersion,
  validateGenerationRequest
} from '../shared/generationSchema.js';

const project = {
  name: 'Forest Adventure',
  gameType: 'Top-down RPG',
  targetEngine: 'Godot',
  tileSize: '32x32',
  artStyle: 'Pixel Fantasy',
  cameraView: 'Top-down',
  palette: ['#35d0ff', '#ff4d6d', '#ffd166']
};

const request = createGenerationRequest(project, {
  assetType: 'Character',
  description: 'red scarf knight with a short sword',
  size: '32x32',
  count: '4',
  transparentBackground: true,
  paletteLock: true,
  outlineMode: 'Medium',
  colorMode: 'Project Palette',
  intendedUse: 'Player Character'
});

const result = validateGenerationRequest(request);

assert(result.valid, `Expected valid request, received: ${result.errors.join('; ')}`);
assert(request.schemaVersion === generationSchemaVersion, 'Schema version should be applied');
assert(request.projectId === 'forest-adventure', 'Project id should be slugified');
assert(request.dimensions.width === 32 && request.dimensions.height === 32, 'Dimensions should be parsed');
assert(request.count === 4, 'Count should be numeric');

const invalidRequest = {
  ...request,
  description: 'bad',
  count: 3
};

const invalidResult = validateGenerationRequest(invalidRequest);
assert(!invalidResult.valid, 'Invalid request should fail validation');
assert(invalidResult.errors.length >= 2, 'Invalid request should report all schema errors');

console.log('Generation schema tests passed.');

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}
