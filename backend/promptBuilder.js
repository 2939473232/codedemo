const assetTypePrompts = {
  角色: 'single full-body game character sprite, readable silhouette, centered pose, no background scene',
  敌人: 'single fantasy enemy sprite, readable silhouette, centered pose, no background scene',
  道具: 'single inventory item icon, centered, clear object shape, no background scene',
  图标: 'single UI icon, centered, high readability, clean shape, no background scene',
  地图: 'seamless 2D game map tile, repeatable edges, top-down ground material, no characters',
  界面元素: '2D game UI element, clean interface asset, isolated component, no background scene',
  特效: 'single 2D game VFX frame, transparent-looking dark neutral background, readable motion shape'
};

const stylePrompts = {
  像素奇幻: 'pixel art fantasy game asset, crisp edges, limited palette',
  手绘卡通: 'hand painted cartoon game asset, soft brush detail, playful shape language',
  赛博霓虹: 'cyber neon game asset, glowing accents, high contrast sci-fi palette',
  暗黑哥特: 'dark gothic game asset, dramatic contrast, ornate fantasy detail',
  'Q 版可爱': 'cute chibi game asset, rounded proportions, bright friendly colors'
};

const viewPrompts = {
  俯视角: 'top-down view',
  侧视角: 'side view',
  等距视角: 'isometric view',
  图标正面: 'front-facing icon view'
};

const outlinePrompts = {
  无: 'no outline',
  轻描边: 'thin outline',
  中描边: 'medium readable outline',
  粗描边: 'bold outline'
};

export function buildImagePrompt(request) {
  const assetTypePrompt = assetTypePrompts[request.assetType] || '2D game asset';
  const stylePrompt = stylePrompts[request.style.artStyle] || request.style.artStyle;
  const viewPrompt = viewPrompts[request.style.cameraView] || request.style.cameraView;
  const outlinePrompt = outlinePrompts[request.outlineMode] || request.outlineMode;
  const palettePrompt = request.paletteLock
    ? `use this project palette as inspiration: ${request.style.palette.join(', ')}`
    : 'use a coherent game color palette';
  const transparentPrompt = request.transparentBackground
    ? 'isolated asset, transparent background style, no scenery'
    : 'simple clean background';

  return [
    request.description,
    assetTypePrompt,
    stylePrompt,
    viewPrompt,
    `${request.size} target asset`,
    outlinePrompt,
    palettePrompt,
    transparentPrompt,
    `intended use: ${request.intendedUse}`,
    'game-ready 2D asset, polished, cohesive, no text, no watermark'
  ].filter(Boolean).join(', ');
}

export function buildNegativePrompt(request) {
  const commonNegatives = [
    'photorealistic',
    '3d render',
    'blurry',
    'low quality',
    'watermark',
    'text',
    'logo',
    'cropped',
    'multiple unrelated objects'
  ];

  if (request.assetType === '地图') {
    commonNegatives.push('character', 'portrait', 'UI panel', 'perspective scene');
  }

  if (['角色', '敌人'].includes(request.assetType)) {
    commonNegatives.push('large scenery', 'background landscape', 'extra limbs');
  }

  return commonNegatives.join(', ');
}
