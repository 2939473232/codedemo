import { validateGenerationRequest } from '../shared/generationSchema.js';
import { createFallbackManifest, generateFallbackAssets } from './fallbackGenerator.js';
import { isWanxConfigured, generateWanxAssets } from './wanxProvider.js';

const jobs = new Map();

export function createGenerationJob(request) {
  const validation = validateGenerationRequest(request);

  if (!validation.valid) {
    return {
      ok: false,
      statusCode: 422,
      payload: {
        error: '生成请求无效',
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
  runJob(job.id);

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
      payload: { error: '生成任务不存在' }
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

async function runJob(jobId) {
  const job = jobs.get(jobId);

  if (!job) {
    return;
  }

  try {
    updateJob(job, 'queued', 12);
    await delay(180);
    updateJob(job, 'prompting', 34);
    await delay(180);
    updateJob(job, 'generating', 72);
    job.result = await buildJobResult(job);
    updateJob(job, 'completed', 100);
  } catch (error) {
    job.error = error.message;
    job.result = buildFallbackJobResult(job, {
      provider: 'fallback',
      warning: error.message
    });
    updateJob(job, 'completed', 100);
  }
}

async function buildJobResult(job) {
  const provider = getImageProvider();

  if (provider === 'wanx') {
    if (!isWanxConfigured()) {
      throw new Error('未配置 DASHSCOPE_API_KEY，已使用演示生成。');
    }

    const assets = await generateWanxAssets(job.request);
    return createResult(job.request, assets, {
      provider: 'wanx-v1',
      manifestProvider: 'wanx-v1'
    });
  }

  return buildFallbackJobResult(job, {
    provider: 'fallback'
  });
}

function buildFallbackJobResult(job, options = {}) {
  const { request } = job;
  const assets = generateFallbackAssets(request);
  return createResult(request, assets, {
    provider: options.provider || 'fallback',
    warning: options.warning,
    manifestProvider: 'fallback-generator'
  });
}

function createResult(request, assets, options) {
  return {
    assetCount: request.count,
    assetType: request.assetType,
    style: request.style.artStyle,
    engine: request.target.engine,
    exportHint: `${request.target.engine} 可用的 ${request.size} PNG 序列`,
    previewSeed: `${request.projectId}:${request.assetType}:${request.description}`,
    provider: options.provider,
    warning: options.warning || null,
    assets,
    manifest: createFallbackManifest(request, assets, {
      generatedBy: options.manifestProvider || options.provider
    })
  };
}

function updateJob(job, status, progress) {
  job.status = status;
  job.progress = progress;
  job.updatedAt = new Date().toISOString();
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

function getImageProvider() {
  return String(process.env.SPRITEFORGE_IMAGE_PROVIDER || 'fallback').toLowerCase();
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
