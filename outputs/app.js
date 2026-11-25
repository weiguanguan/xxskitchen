import { createDishRepository } from './js/dish-repository.js';
import { createCroppedPhoto, readPhotoPreview, uploadPhoto } from './js/photo-uploader.js';

const $ = (selector) => document.querySelector(selector);
const repository = createDishRepository();
const photoCard = $('#photo-card');
const preview = $('#photo-preview');
const photoError = $('#photo-error');
let selectedFile = null;
let selectedPhotoPreviewUrl = '';
let cropState = { scale: 1, x: 0, y: 0 };
let dragState = null;
let selectedTags = new Set();
let ingredients = new Set();

async function loadPhoto(file) {
  if (!file) return;
  try {
    selectedPhotoPreviewUrl = await readPhotoPreview(file);
    selectedFile = file;
    cropState = { scale: 1, x: 0, y: 0 };
    preview.src = selectedPhotoPreviewUrl;
    photoCard.classList.add('has-photo');
    $('#photo-adjust-controls').hidden = false;
    renderPhotoTransform();
    photoCard.classList.remove('has-error');
    photoError.textContent = '';
  } catch (error) {
    photoError.textContent = error.message;
  }
}

function renderPhotoTransform() {
  photoCard.style.setProperty('--photo-x', `${cropState.x}px`);
  photoCard.style.setProperty('--photo-y', `${cropState.y}px`);
  photoCard.style.setProperty('--photo-scale', cropState.scale);
}

function setPhotoScale(nextScale) {
  cropState.scale = Math.min(3, Math.max(1, Number(nextScale.toFixed(2))));
  renderPhotoTransform();
}

$('#zoom-in').addEventListener('click', () => setPhotoScale(cropState.scale + 0.1));
$('#zoom-out').addEventListener('click', () => setPhotoScale(cropState.scale - 0.1));
$('#reset-photo').addEventListener('click', () => { cropState = { scale: 1, x: 0, y: 0 }; renderPhotoTransform(); });
photoCard.addEventListener('pointerdown', (event) => {
  if (!selectedFile) return;
  photoCard.setPointerCapture(event.pointerId);
  dragState = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: cropState.x, originY: cropState.y };
});
photoCard.addEventListener('pointermove', (event) => {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  cropState.x = dragState.originX + event.clientX - dragState.startX;
  cropState.y = dragState.originY + event.clientY - dragState.startY;
  renderPhotoTransform();
});
photoCard.addEventListener('pointerup', () => { dragState = null; });
photoCard.addEventListener('pointercancel', () => { dragState = null; });

$('#camera-button').addEventListener('click', () => $('#camera-input').click());
$('#album-button').addEventListener('click', () => $('#album-input').click());
$('#camera-input').addEventListener('change', (event) => loadPhoto(event.target.files[0]));
$('#album-input').addEventListener('change', (event) => loadPhoto(event.target.files[0]));
$('#remove-photo').addEventListener('click', () => {
  selectedFile = null;
  selectedPhotoPreviewUrl = '';
  preview.src = '';
  photoCard.classList.remove('has-photo');
  $('#photo-adjust-controls').hidden = true;
  cropState = { scale: 1, x: 0, y: 0 };
  renderPhotoTransform();
  $('#camera-input').value = '';
  $('#album-input').value = '';
});

function updateTagHint() {
  $('#selected-hint').textContent = selectedTags.size ? `已选择 ${selectedTags.size} 个标签：${[...selectedTags].join('、')}` : '还没有选择标签';
}

$('#tag-list').addEventListener('click', (event) => {
  const tag = event.target.closest('.tag');
  if (!tag || tag.id === 'add-tag') return;
  const value = tag.dataset.tag;
  if (selectedTags.has(value)) {
    selectedTags.delete(value);
    tag.classList.remove('selected');
    tag.setAttribute('aria-pressed', 'false');
  } else {
    selectedTags.add(value);
    tag.classList.add('selected');
    tag.setAttribute('aria-pressed', 'true');
  }
  updateTagHint();
});

$('#add-tag').addEventListener('click', () => { $('#custom-tag-row').hidden = false; $('#custom-tag').focus(); });
$('#confirm-tag').addEventListener('click', addCustomTag);
$('#custom-tag').addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); addCustomTag(); } });
function addCustomTag() {
  const input = $('#custom-tag');
  const value = input.value.trim();
  if (!value || selectedTags.has(value)) return;
  const tag = document.createElement('button');
  tag.type = 'button'; tag.className = 'tag selected'; tag.dataset.tag = value; tag.textContent = value; tag.setAttribute('aria-pressed', 'true');
  $('#add-tag').before(tag); selectedTags.add(value); input.value = ''; $('#custom-tag-row').hidden = true; updateTagHint();
}

function updateIngredientHint() {
  $('#ingredient-hint').textContent = ingredients.size ? `已添加 ${ingredients.size} 种食材：${[...ingredients].join('、')}` : '还没有添加食材';
}

$('#add-ingredient').addEventListener('click', addIngredient);
$('#ingredient-input').addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); addIngredient(); } });
$('#ingredient-list').addEventListener('click', (event) => {
  const ingredient = event.target.closest('.ingredient');
  if (!ingredient) return;
  ingredients.delete(ingredient.dataset.ingredient);
  ingredient.remove();
  updateIngredientHint();
});
function addIngredient() {
  const input = $('#ingredient-input');
  const value = input.value.trim();
  if (!value || ingredients.has(value)) return;
  const ingredient = document.createElement('button');
  ingredient.type = 'button'; ingredient.className = 'tag ingredient selected'; ingredient.dataset.ingredient = value; ingredient.textContent = `${value} ×`; ingredient.setAttribute('aria-label', `移除食材 ${value}`);
  $('#ingredient-list').append(ingredient); ingredients.add(value); input.value = ''; updateIngredientHint(); input.focus();
}

$('#notes').addEventListener('input', (event) => { $('#character-count').textContent = event.target.value.length; });

$('#dish-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = $('#dish-name').value.trim();
  let valid = true;
  if (!selectedFile) { photoError.textContent = '请先上传一道菜的成品照片'; photoCard.classList.add('has-error'); valid = false; }
  if (!name) { $('#name-error').textContent = '请输入菜品名称'; $('#dish-name').classList.add('has-error'); valid = false; }
  else { $('#name-error').textContent = ''; $('#dish-name').classList.remove('has-error'); }
  if (!valid) { $('.feedback').className = 'feedback'; return; }
  try {
    const croppedFile = await createCroppedPhoto(selectedFile, cropState, photoCard.clientWidth);
    const photo = await uploadPhoto(croppedFile, selectedPhotoPreviewUrl);
    const result = await repository.createDish({ name, tags: [...selectedTags], ingredients: [...ingredients], notes: $('#notes').value.trim(), photoUrl: photo.url });
    $('.feedback').className = 'feedback success';
    $('#feedback').textContent = result.persistence === 'demo'
      ? `已在本地 Demo 中保存「${name}」。当前未连接 Cloudflare API，刷新页面后数据不会保留。`
      : `已保存「${name}」。照片和记录已交给 Cloudflare API 处理。`;
  } catch (error) {
    $('.feedback').className = 'feedback error';
    $('#feedback').textContent = error.message;
  }
  $('#feedback').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

$('#dish-name').addEventListener('input', () => {
  if ($('#dish-name').value.trim()) { $('#name-error').textContent = ''; $('#dish-name').classList.remove('has-error'); }
});
