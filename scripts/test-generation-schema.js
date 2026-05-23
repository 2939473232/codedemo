import {
  createGenerationRequest,
  generationSchemaVersion,
  validateGenerationRequest
} from '../shared/generationSchema.js';

const project = {
  name: '森林冒险',
  gameType: '俯视角 RPG',
  targetEngine: 'Godot',
  tileSize: '32x32',
  artStyle: '像素奇幻',
  cameraView: '俯视角',
  palette: ['#35d0ff', '#ff4d6d', '#ffd166']
};

const request = createGenerationRequest(project, {
  assetType: '角色',
  description: '戴红色围巾的短剑骑士',
  size: '32x32',
  count: '4',
  transparentBackground: true,
  paletteLock: true,
  outlineMode: '中描边',
  colorMode: '项目调色板',
  intendedUse: '玩家角色'
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
