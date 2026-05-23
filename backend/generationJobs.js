import { validateGenerationRequest } from '../shared/generationSchema.js';

const jobs = new Map();
const jobTimeline = [
  { status: 'queued', progress: 12, delay: 0 },
  { status: 'prompting', progress: 34, delay: 260 },
  { status: 'generating', progress: 72, delay: 620 },
  { status: 'completed', progress: 100, delay: 980 }
];

export function createGenerationJob(request) {
  const validation = validateGenerationRequest(request);

  if (!validation.valid) {
    return {
      ok: false,
      statusCode: 422,
      payload: {
        error: 'Invalid generation request',
        details: validation.errors
      }
    };
  }

  const now = new Date().toISOString();
  const job = {
    id: createJobId(),
    status: 'queued',
    progress: 0,
    request,
    result: null,
    error: null,
    createdAt: now,
    updatedAt: now
  };

  jobs.set(job.id, job);
  scheduleJob(job.id);

  return {
    ok: true,
    statusCode: 202,
    payload: serializeJob(job)
  };
}

export function getGenerationJob(jobId) {
  const job = jobs.get(jobId);

  if (!job) {
    return {
      ok: false,
      statusCode: 404,
      payload: { error: 'Generation job not found' }
    };
  }

  return {
    ok: true,
    statusCode: 200,
    payload: serializeJob(job)
  };
}

export function listGenerationJobs() {
  return Array.from(jobs.values()).map(serializeJob).reverse();
}

function scheduleJob(jobId) {
  for (const step of jobTimeline) {
    setTimeout(() => {
      const job = jobs.get(jobId);

      if (!job) {
        return;
      }

      job.status = step.status;
      job.progress = step.progress;
      job.updatedAt = new Date().toISOString();

      if (step.status === 'completed') {
        job.result = buildJobResult(job);
      }
    }, step.delay);
  }
}

function buildJobResult(job) {
  const { request } = job;

  return {
    assetCount: request.count,
    assetType: request.assetType,
    style: request.style.artStyle,
    engine: request.target.engine,
    exportHint: `${request.target.engine} ready ${request.size} PNG sequence`,
    previewSeed: `${request.projectId}:${request.assetType}:${request.description}`
  };
}

function serializeJob(job) {
  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    request: job.request,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  };
}

function createJobId() {
  const random = Math.random().toString(36).slice(2, 8);
  return `job_${Date.now().toString(36)}_${random}`;
}
