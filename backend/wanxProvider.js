import { buildImagePrompt, buildNegativePrompt } from './promptBuilder.js';

const dashScopeBaseUrl = 'https://dashscope.aliyuncs.com/api/v1';
const defaultModel = 'wanx-v1';
const defaultPollIntervalMs = 1400;
const defaultTimeoutMs = 120000;

export function isWanxConfigured(env = process.env) {
  return Boolean(getApiKey(env));
}

export async function generateWanxAssets(request, options = {}) {
  const env = options.env || process.env;
  const apiKey = getApiKey(env);

  if (!apiKey) {
    throw new Error('缺少 DASHSCOPE_API_KEY，已切换到演示生成。');
  }

  const prompt = buildImagePrompt(request);
  const negativePrompt = buildNegativePrompt(request);
  const task = await submitWanxTask(request, {
    apiKey,
    prompt,
    negativePrompt,
    model: env.WANX_MODEL || defaultModel,
    baseUrl: env.DASHSCOPE_BASE_URL || dashScopeBaseUrl
  });
  const result = await waitForWanxTask(task.output.task_id, {
    apiKey,
    baseUrl: env.DASHSCOPE_BASE_URL || dashScopeBaseUrl,
    pollIntervalMs: Number(env.WANX_POLL_INTERVAL_MS || defaultPollIntervalMs),
    timeoutMs: Number(env.WANX_TIMEOUT_MS || defaultTimeoutMs)
  });
  const images = extractImages(result);

  if (!images.length) {
    throw new Error('wanx-v1 未返回图片结果，已切换到演示生成。');
  }

  return images.slice(0, request.count).map((image, index) => createWanxAsset(request, image, index, {
    prompt,
    negativePrompt,
    taskId: task.output.task_id
  }));
}

async function submitWanxTask(request, options) {
  const response = await fetch(`${options.baseUrl}/services/aigc/text2image/image-synthesis`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable'
    },
    body: JSON.stringify({
      model: options.model,
      input: {
        prompt: options.prompt,
        negative_prompt: options.negativePrompt
      },
      parameters: {
        n: request.count,
        size: chooseWanxSize(request.size)
      }
    })
  });

  const payload = await parseDashScopeResponse(response);
  const taskId = payload.output?.task_id;

  if (!taskId) {
    throw new Error('wanx-v1 任务创建失败：响应中缺少 task_id。');
  }

  return payload;
}

async function waitForWanxTask(taskId, options) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < options.timeoutMs) {
    const response = await fetch(`${options.baseUrl}/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${options.apiKey}`
      }
    });
    const payload = await parseDashScopeResponse(response);
    const status = payload.output?.task_status;

    if (status === 'SUCCEEDED') {
      return payload;
    }

    if (['FAILED', 'UNKNOWN', 'CANCELED'].includes(status)) {
      throw new Error(payload.output?.message || `wanx-v1 任务失败：${status}`);
    }

    await delay(options.pollIntervalMs);
  }

  throw new Error('wanx-v1 任务等待超时，已切换到演示生成。');
}

async function parseDashScopeResponse(response) {
  let payload;

  try {
    payload = await response.json();
  } catch {
    throw new Error(`DashScope 返回了非 JSON 响应：HTTP ${response.status}`);
  }

  if (!response.ok) {
    const message = payload.message || payload.error || payload.code || `HTTP ${response.status}`;
    throw new Error(`DashScope 请求失败：${message}`);
  }

  return payload;
}

function extractImages(payload) {
  const results = payload.output?.results || payload.output?.task_results || [];

  return results
    .map((item) => item.url || item.image_url || item.output_url)
    .filter(Boolean)
    .map((url) => ({ url }));
}

function createWanxAsset(request, image, index, metadata) {
  const variant = index + 1;
  const assetName = request.count === 1 ? request.description : `${request.description} ${variant}`;
  const id = createStableId(`${request.projectId}:${request.assetType}:${request.description}:wanx:${variant}:${image.url}`);

  return {
    id,
    name: assetName,
    type: request.assetType,
    fileName: `${slugify(assetName)}_${request.size}.png`,
    width: request.dimensions.width,
    height: request.dimensions.height,
    imageUrl: image.url,
    color: request.style.palette[index % request.style.palette.length] || '#35d0ff',
    accent: request.style.palette[(index + 2) % request.style.palette.length] || '#ff4d6d',
    style: request.style.artStyle,
    engine: request.target.engine,
    transparentBackground: request.transparentBackground,
    metadata: {
      outlineMode: request.outlineMode,
      colorMode: request.colorMode,
      intendedUse: request.intendedUse,
      paletteLocked: request.paletteLock,
      provider: 'wanx-v1',
      prompt: metadata.prompt,
      negativePrompt: metadata.negativePrompt,
      taskId: metadata.taskId
    }
  };
}

function chooseWanxSize(size) {
  const [width, height] = String(size || '32x32').split('x').map(Number);
  const maxSide = Math.max(width || 32, height || 32);

  if (maxSide <= 512) {
    return '512*512';
  }

  if (maxSide <= 768) {
    return '768*768';
  }

  return '1024*1024';
}

function getApiKey(env) {
  return env.DASHSCOPE_API_KEY || env.DASHSCOPE_API_KEY_ID || env.SPRITEFORGE_DASHSCOPE_API_KEY || '';
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function slugify(value) {
  return String(value || 'asset')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'asset';
}

function createStableId(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return `asset_${hash.toString(16).padStart(8, '0')}`;
}
