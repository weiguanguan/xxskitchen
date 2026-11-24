function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.PHOTOS) return json({ error: 'R2 binding PHOTOS is not configured' }, 503);
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return json({ error: 'file is required' }, 400);
  if (!file.type.startsWith('image/')) return json({ error: 'only image files are allowed' }, 415);
  if (file.size > 10 * 1024 * 1024) return json({ error: 'image must be 10MB or smaller' }, 413);

  const extension = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase();
  const key = `dishes/${crypto.randomUUID()}.${extension}`;
  await env.PHOTOS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'image/jpeg' },
  });

  return json({ url: `/api/photos?key=${encodeURIComponent(key)}`, key });
}

export async function onRequestGet({ request, env }) {
  if (!env.PHOTOS) return new Response('R2 binding PHOTOS is not configured', { status: 503 });
  const key = new URL(request.url).searchParams.get('key');
  if (!key) return new Response('key is required', { status: 400 });
  const object = await env.PHOTOS.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}
