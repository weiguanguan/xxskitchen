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
