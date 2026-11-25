import { appConfig } from './config.js';
import { demoDishes } from './demo-data.js';

// 页面只依赖这两个方法，不依赖具体数据库或部署平台。
export class DemoDishRepository {
  constructor(records = demoDishes) {
    this.records = [...records];
  }

  async listDishes() {
    return [...this.records];
  }

  async createDish(input) {
    const record = {
      id: `demo-${Date.now()}`,
      name: input.name,
      tags: input.tags,
      ingredients: input.ingredients,
      notes: input.notes,
      photoUrl: input.photoUrl || '',
    };
    this.records.unshift(record);
    return { record, persistence: 'demo' };
  }

  async deleteDish(id) {
    this.records = this.records.filter((record) => record.id !== id);
    return { persistence: 'demo' };
  }
}

export class CloudflareDishRepository {
  constructor(config = appConfig) {
    this.apiBaseUrl = config.apiBaseUrl;
  }

  async listDishes() {
    const response = await fetch(`${this.apiBaseUrl}/dishes`);
    if (!response.ok) throw new Error('Cloudflare D1 菜品接口暂不可用。');
    return response.json();
  }

  async createDish(input) {
    const response = await fetch(`${this.apiBaseUrl}/dishes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Cloudflare D1 菜品保存失败。');
    return { record: await response.json(), persistence: 'cloudflare' };
  }

  async deleteDish(id) {
    const response = await fetch(`${this.apiBaseUrl}/dishes?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Cloudflare D1 菜品删除失败。');
    return { persistence: 'cloudflare' };
  }
}

export function createDishRepository() {
  return appConfig.apiEnabled ? new CloudflareDishRepository() : new DemoDishRepository();
}
