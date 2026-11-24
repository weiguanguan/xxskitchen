function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function onRequestGet({ env }) {
  if (!env.kitchendb) return json({ error: 'D1 binding kitchendb is not configured' }, 503);
  const result = await env.kitchendb.prepare(
    'SELECT id, name, tags_json, ingredients_json, notes, photo_url, created_at FROM dishes ORDER BY created_at DESC',
  ).all();
  return json(result.results.map((row) => ({
    id: row.id,
    name: row.name,
    tags: JSON.parse(row.tags_json || '[]'),
    ingredients: JSON.parse(row.ingredients_json || '[]'),
    notes: row.notes || '',
    photoUrl: row.photo_url || '',
    createdAt: row.created_at,
  })));
}

export async function onRequestPost({ request, env }) {
  if (!env.kitchendb) return json({ error: 'D1 binding kitchendb is not configured' }, 503);
  const input = await request.json();
  if (!input.name || !input.photoUrl) return json({ error: 'name and photoUrl are required' }, 400);

  const id = crypto.randomUUID();
  await env.kitchendb.prepare(
    `INSERT INTO dishes (id, name, tags_json, ingredients_json, notes, photo_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
  ).bind(
    id,
    input.name,
    JSON.stringify(input.tags || []),
    JSON.stringify(input.ingredients || []),
    input.notes || '',
    input.photoUrl,
  ).run();

  return json({ id, ...input });
}
