import { DemoDishRepository, createDishRepository } from './js/dish-repository.js';

const repository = createDishRepository();
const chips = document.querySelectorAll('.filter-chip');
const grid = document.querySelector('#dish-grid');
const empty = document.querySelector('#empty-state');
const count = document.querySelector('#record-count');

function renderDishes(records) {
  grid.innerHTML = records.map((dish) => `
    <article class="dish-card" data-tags="${dish.tags.join(',')}">
      <img src="${dish.photoUrl}" alt="${dish.name}" />
      <div class="dish-info"><h2>${dish.name}</h2><span>${dish.tags.join(' · ')}</span></div>
    </article>
  `).join('');
  count.textContent = `${String(records.length).padStart(2, '0')} 道记录`;
  empty.hidden = records.length !== 0;
}

let allDishes;
try {
  allDishes = await repository.listDishes();
} catch (error) {
  // API 尚未完成绑定时仍保留可浏览的 Demo，不把失败伪装成云端数据。
  allDishes = await new DemoDishRepository().listDishes();
  const note = document.createElement('p');
  note.className = 'data-notice';
  note.textContent = '当前显示 Demo 菜品，Cloudflare D1 尚未连接。';
  document.querySelector('.filter-section').append(note);
}
renderDishes(allDishes);

chips.forEach((chip) => chip.addEventListener('click', () => {
  const filter = chip.dataset.filter;
  chips.forEach((item) => item.classList.toggle('active', item === chip));
  renderDishes(filter === '全部' ? allDishes : allDishes.filter((dish) => dish.tags.includes(filter)));
}));
