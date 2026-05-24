import { createGenerationJob, getGenerationJob, listGenerationJobs } from '../backend/generationJobs.js';
import { createGenerationRequest } from '../shared/generationSchema.js';

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

const created = createGenerationJob(request);
assert(created.ok, 'Expected valid job creation to succeed');
assert(created.statusCode === 202, 'Expected job creation to return 202');
assert(created.payload.id.startsWith('job_'), 'Expected generated job id');

const fetched = getGenerationJob(created.payload.id);
assert(fetched.ok, 'Expected created job to be fetchable');
assert(fetched.payload.request.projectId === 'forest-adventure', 'Expected job to store request');
assert(listGenerationJobs().length >= 1, 'Expected job list to include created job');

await waitForJobCompletion(created.payload.id);

const invalid = createGenerationJob({ ...request, count: 3 });
assert(!invalid.ok, 'Expected invalid job creation to fail');
assert(invalid.statusCode === 422, 'Expected invalid job to return 422');

console.log('Generation job tests passed.');

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

async function waitForJobCompletion(jobId) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const result = getGenerationJob(jobId);

    if (result.payload.status === 'completed') {
      assert(result.payload.result.assets.length === 4, 'Expected completed job assets');
      assert(result.payload.result.manifest.files.length === 4, 'Expected completed job manifest files');
      assert(result.payload.result.provider === 'fallback', 'Expected fallback provider by default');
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 120);
    });
  }

  assert(false, 'Expected job to complete within test window');
}
