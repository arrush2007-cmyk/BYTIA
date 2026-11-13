export interface CompressedImageResult {
  /** Compact data URL (<= ~140KB) safe to persist in Firestore documents */
  storageDataUrl: string;
  /** Higher-detail base64 string (without data: prefix) for Gemini AI analysis */
  analysisBase64: string;
  mimeType: 'image/jpeg';
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB raw file cap

export function validateImageFile(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (!file.type.startsWith('image/') && !allowedTypes.includes(file.type)) {
    return 'Please upload a valid image file (JPEG, PNG, or WebP).';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'Image file exceeds the 8 MB upload limit. Please select a smaller photo.';
  }
  return null;
}

function renderToJpeg(img: HTMLImageElement, maxDim: number, quality: number): string {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const width = Math.max(1, Math.round((img.naturalWidth || maxDim) * scale));
  const height = Math.max(1, Math.round((img.naturalHeight || maxDim) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser canvas context unavailable for image compression.');
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function processImageFile(file: File): Promise<CompressedImageResult> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.readAsDataURL(file);
  });

  return processDataUrl(rawDataUrl);
}

export async function processDataUrl(dataUrl: string): Promise<CompressedImageResult> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Unable to decode image. Please try a JPEG or PNG photo.'));
    el.src = dataUrl;
  });

  const analysisDataUrl = renderToJpeg(img, 1024, 0.84);
  let storageDataUrl = renderToJpeg(img, 520, 0.72);
  if (storageDataUrl.length > 160000) {
    storageDataUrl = renderToJpeg(img, 380, 0.62);
  }

  const analysisBase64 = analysisDataUrl.split(',')[1] || '';
  return {
    storageDataUrl,
    analysisBase64,
    mimeType: 'image/jpeg',
  };
}
