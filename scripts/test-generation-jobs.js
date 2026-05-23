import { createGenerationJob, getGenerationJob, listGenerationJobs } from '../backend/generationJobs.js';
import { createGenerationRequest } from '../shared/generationSchema.js';

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
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 120);
    });
  }

  assert(false, 'Expected job to complete within test window');
}
