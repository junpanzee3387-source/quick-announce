/* 更新するときは CACHE_NAME の番号を必ず変える（v3 → v4 …） */
const CACHE_NAME = 'yakyuban-offline-v3';
/* './index.html' ではなく './' を使う（Cloudflare Pages は /index.html を / へリダイレクトするため） */
const APP_SHELL = [
  './',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    event.respondWith(new Response('', {status: 504, statusText: 'Offline'}));
    return;
  }

  // ページ表示: 常にキャッシュ済みアプリ本体を返す（ネットワークには出ない）
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./').then(response =>
        response || new Response('Offline app is not installed yet.', {
          status: 503,
          headers: {'Content-Type': 'text/plain; charset=utf-8'}
        })
      )
    );
    return;
  }

  // その他の同一オリジンGET: キャッシュのみ
  event.respondWith(
    caches.match(event.request, {ignoreSearch: true}).then(response =>
      response || new Response('', {status: 504, statusText: 'Offline'})
    )
  );
});
