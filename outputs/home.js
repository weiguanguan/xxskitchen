import { createDishRepository } from './js/dish-repository.js';

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

const allDishes = await repository.listDishes();
renderDishes(allDishes);

chips.forEach((chip) => chip.addEventListener('click', () => {
  const filter = chip.dataset.filter;
  chips.forEach((item) => item.classList.toggle('active', item === chip));
  renderDishes(filter === '全部' ? allDishes : allDishes.filter((dish) => dish.tags.includes(filter)));
}));
