import { appConfig } from './config.js';

export function readPhotoPreview(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('请选择有效的图片文件。'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('照片预览读取失败，请重试。'));
    reader.readAsDataURL(file);
  });
}

export function createCroppedPhoto(file, crop, viewportSize, outputSize = 900) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const context = canvas.getContext('2d');
      const baseScale = Math.max(viewportSize / image.naturalWidth, viewportSize / image.naturalHeight);
      const drawScale = baseScale * crop.scale;
      const drawWidth = image.naturalWidth * drawScale;
      const drawHeight = image.naturalHeight * drawScale;
      const ratio = outputSize / viewportSize;
      const x = (viewportSize - drawWidth) / 2 + crop.x;
      const y = (viewportSize - drawHeight) / 2 + crop.y;
      context.drawImage(image, x * ratio, y * ratio, drawWidth * ratio, drawHeight * ratio);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('照片处理失败，请重试。'));
        resolve(new File([blob], 'dish-photo.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.88);
    };
    image.onerror = () => reject(new Error('照片处理失败，请重试。'));
    image.src = URL.createObjectURL(file);
  });
}

// 页面只调用这个接口；实际文件写入由 Cloudflare R2 API 完成。
export async function uploadPhoto(file, previewUrl = '') {
  if (!appConfig.apiEnabled) {
    return { url: previewUrl, persistence: 'demo' };
  }
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`${appConfig.apiBaseUrl}/photos`, { method: 'POST', body });
  if (!response.ok) throw new Error('Cloudflare R2 照片上传失败。');
  return { ...(await response.json()), persistence: 'cloudflare' };
}
