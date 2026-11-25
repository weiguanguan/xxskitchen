import { DemoDishRepository, createDishRepository } from './js/dish-repository.js';

const repository = createDishRepository();
const id = new URLSearchParams(window.location.search).get('id');
const content = document.querySelector('#detail-content');
const state = document.querySelector('#detail-state');
let dish;

function render(record) {
  dish = record;
  document.querySelector('#detail-photo').src = record.photoUrl;
  document.querySelector('#detail-photo').alt = record.name;
  document.querySelector('#detail-name').textContent = record.name;
  document.querySelector('#detail-tags').innerHTML = (record.tags || []).map((tag) => `<span>${tag}</span>`).join('');
  const ingredients = record.ingredients || [];
  document.querySelector('#detail-ingredients').innerHTML = ingredients.map((item) => `<span>${item}</span>`).join('');
  document.querySelector('#ingredients-section').hidden = ingredients.length === 0;
  document.querySelector('#detail-notes').textContent = record.notes || '';
  document.querySelector('#notes-section').hidden = !record.notes;
  document.querySelector('#edit-dish').href = `/add.html?id=${encodeURIComponent(record.id)}`;
  content.hidden = false;
  state.hidden = true;
}

try {
  let records;
  try {
    records = await repository.listDishes();
  } catch (error) {
    // 预览环境未绑定 D1 时仍可浏览详情 Demo，不把示例数据伪装成云端记录。
    records = await new DemoDishRepository().listDishes();
    const notice = document.createElement('p');
    notice.className = 'data-notice';
    notice.textContent = '当前显示 Demo 菜品，Cloudflare D1 尚未连接。';
    document.querySelector('.detail-shell').prepend(notice);
  }
  const record = records.find((item) => item.id === id);
  if (!record) throw new Error('找不到这道菜品。');
  render(record);
} catch (error) {
  state.textContent = error.message;
  state.classList.add('error');
}

document.querySelector('#delete-dish').addEventListener('click', async () => {
  if (!dish || !window.confirm(`确定删除「${dish.name}」吗？`)) return;
  try {
    await repository.deleteDish(dish.id);
    window.location.href = '/home';
  } catch (error) {
    document.querySelector('#detail-feedback').textContent = error.message;
  }
});
