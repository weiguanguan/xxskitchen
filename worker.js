import { onRequestGet as getDishes, onRequestPost as postDishes } from './functions/api/dishes.js';
import { onRequestGet as getPhoto, onRequestPost as postPhoto } from './functions/api/photos.js';

function methodNotAllowed() {
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST' } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/dishes') {
      if (request.method === 'GET') return getDishes({ request, env, ctx });
      if (request.method === 'POST') return postDishes({ request, env, ctx });
      return methodNotAllowed();
    }

    if (url.pathname === '/api/photos') {
      if (request.method === 'GET') return getPhoto({ request, env, ctx });
      if (request.method === 'POST') return postPhoto({ request, env, ctx });
      return methodNotAllowed();
    }

    if (url.pathname === '/' && (request.method === 'GET' || request.method === 'HEAD')) {
      url.pathname = '/home.html';
      return env.ASSETS.fetch(new Request(url, request));
    }

    return env.ASSETS.fetch(request);
  },
};
